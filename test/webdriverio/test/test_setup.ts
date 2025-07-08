/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run automated functional tests in
 * Chrome, via webdriver.
 *
 * This file is to be used in the suiteSetup for any automated fuctional test.
 *
 * Note: In this file many functions return browser elements that can
 * be clicked or otherwise interacted with through Selenium WebDriver. These
 * elements are not the raw HTML and SVG elements on the page; they are
 * identifiers that Selenium can use to find those elements.
 */

import * as Blockly from 'blockly';
import * as webdriverio from 'webdriverio';
import * as path from 'path';
import {fileURLToPath} from 'url';

/** The TestDriver wrapper instance, which should only be initialized once. */
let driver: TestDriver | null = null;

/**
 * Start up the test page. This should only be done once, to avoid constantly
 * popping browser windows open and closed.
 *
 * Note that tests should never need to call this directly.
 */
export async function driverSetup() {
  const options = {
    capabilities: {
      'browserName': 'chrome',
      'unhandledPromptBehavior': 'ignore',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'goog:chromeOptions': {
        args: ['--allow-file-access-from-files'],
      },
      // We aren't (yet) using any BiDi features, and BiDi is sensitive to
      // mismatches between Chrome version and Chromedriver version.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'wdio:enforceWebDriverClassic': true,
    },
    logLevel: 'warn' as const,
  };

  // Run in headless mode on Github Actions.
  if (process.env.CI) {
    options.capabilities['goog:chromeOptions'].args.push(
      '--headless',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    );
  } else {
    // --disable-gpu is needed to prevent Chrome from hanging on Linux with
    // NVIDIA drivers older than v295.20. See
    // https://github.com/google/blockly/issues/5345 for details.
    options.capabilities['goog:chromeOptions'].args.push('--disable-gpu');
  }
  // Use Selenium to bring up the page
  console.log('Starting webdriverio...');

  driver = new TestDriver(await webdriverio.remote(options));
}

/**
 * End the webdriverIO session.
 *
 * @return A Promise that resolves after the actions have been completed.
 */
export async function driverTeardown() {
  await driver?.browser.deleteSession();
  driver = null;
  return;
}

/**
 * Navigate to the correct URL for the test, using the shared driver.
 *
 * @param playgroundType The test playground that should be opened for testing.
 * @returns A Promise that resolves to a TestDriver that tests can manipulate.
 */
export async function testSetup(
  playgroundType: TestPlayground,
): Promise<TestDriver> {
  const testDriver = driver;
  if (!testDriver) {
    throw new Error('WebdriverIO is unexpectedly not yet initialized.');
  }
  let playgroundUrl: string | null = null;
  switch (playgroundType) {
    case TestPlayground.BASE:
      playgroundUrl = createTestUrl();
      break;
    case TestPlayground.NAVIGATION_TEST_BLOCKS:
      playgroundUrl = createTestUrl(
        new URLSearchParams({scenario: 'navigationTestBlocks'}),
      );
      break;
    case TestPlayground.MOVE_TEST_BLOCKS:
      playgroundUrl = createTestUrl(
        new URLSearchParams({scenario: 'moveTestBlocks'}),
      );
      break;
    case TestPlayground.BASE_RTL:
      playgroundUrl = createTestUrl(new URLSearchParams({rtl: 'true'}));
      break;
    case TestPlayground.GERAS:
      playgroundUrl = createTestUrl(new URLSearchParams({renderer: 'geras'}));
      break;
    case TestPlayground.GERAS_RTL:
      playgroundUrl = createTestUrl(
        new URLSearchParams({renderer: 'geras', rtl: 'true'}),
      );
      break;
    default:
      throw new Error(`Invalid playground type: ${playgroundType}.`);
  }
  await testDriver.browser.url(playgroundUrl);
  // Wait for the workspace to exist and be rendered.
  await testDriver.browser
    .$('.blocklySvg .blocklyWorkspace > .blocklyBlockCanvas')
    .waitForExist({timeout: 2000});
  return testDriver;
}

// Relative to dist folder for TS build
const createTestUrl = (options?: URLSearchParams) => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const base = new URL(
    `file://${posixPath(path.join(dirname, '..', '..', 'build', 'index.html'))}`,
  );
  base.search = options?.toString() ?? '';
  return base.toString();
};

/**
 * Corresponds to test-specific playgrounds with preconfigured workspaces for
 * various test scenarios.
 */
export enum TestPlayground {
  BASE = 'base',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NAVIGATION_TEST_BLOCKS = 'navigation_test_blocks',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  MOVE_TEST_BLOCKS = 'move_test_blocks',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BASE_RTL = 'base_rtl',

  GERAS = 'geras',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GERAS_RTL = 'geras_rtl',
}

/**
 * Replaces OS-specific path with POSIX style path.
 *
 * Simplified implementation based on
 * https://stackoverflow.com/a/63251716/4969945
 *
 * @param target target path
 * @returns posix path
 */
function posixPath(target: string): string {
  const result = target.split(path.sep).join(path.posix.sep);
  console.log(result);
  return result;
}

export interface ElementWithId extends WebdriverIO.Element {
  id: string;
}

/**
 * A WebdriverIO.Browser wrapper object with common keyboard navigation-related
 * test utilities.
 *
 * The underlying browser object can be referenced directly using this class's
 * '.browser' property. Otherwise, commonly used utilities may be moved here to
 * avoid code duplication across test suites and to simplify calling into the
 * underlying WebdriverIO browser object (since it's only made accessible
 * through instances of this driver class).
 */
export class TestDriver {
  /**
   * The default amount of time to wait during a test. Increase this to make
   * tests easier to watch; decrease it to make tests run faster.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static readonly PAUSE_TIME = 50;

  constructor(public browser: WebdriverIO.Browser) {}

  /**
   * Pauses test execution for a brief period of time.
   *
   * This is useful to use when waiting for a short asynchronous operation, such
   * as a brief timeout or a browser state update, to complete.
   *
   * Callers should aim to only use this function when necessary as many pauses
   * will unnecessarily slow down tests.
   */
  async pause() {
    await this.browser.pause(TestDriver.PAUSE_TIME);
  }

  /**
   * Copied from blockly browser test_setup.mjs and amended for typescript
   *
   * @returns A Promise that resolves to the ID of the currently selected block.
   */
  async getSelectedBlockId(): Promise<string | undefined> {
    return await this.browser.execute(() => {
      // Note: selected is an ICopyable and I am assuming that it is a BlockSvg.
      return Blockly.common.getSelected()?.id;
    });
  }

  /**
   * Focuses the toolbox category with the given name.
   *
   * @param category The name of the toolbox category to focus.
   */
  async moveToToolboxCategory(category: string) {
    await this.sendKeyAndWait('t');
    const categoryIndex = await this.browser.execute((category) => {
      const all = Array.from(
        document.querySelectorAll('.blocklyToolboxCategoryLabel'),
      ).map((node) => node.textContent);
      return all.indexOf(category);
    }, category);
    if (categoryIndex < 0) {
      throw new Error(`No category found: ${category}`);
    }
    if (categoryIndex > 0) await this.keyDown(categoryIndex);
  }

  /**
   * Returns whether the workspace contains a block with the given id.
   *
   * @param blockId The id of the block.
   */
  async blockIsPresent(blockId: string): Promise<boolean> {
    return await this.browser.execute((blockId) => {
      const workspaceSvg = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
      const block = workspaceSvg.getBlockById(blockId);
      return block !== null;
    }, blockId);
  }

  /** Returns whether the currently focused tree is the main workspace. */
  async focusedTreeIsMainWorkspace(): Promise<boolean> {
    return await this.browser.execute(() => {
      const workspaceSvg = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
      return Blockly.getFocusManager().getFocusedTree() === workspaceSvg;
    });
  }

  /**
   * Focuses and selects a block with the provided ID.
   *
   * This throws an error if no block exists for the specified ID.
   *
   * @param blockId The ID of the block to select.
   */
  async focusOnBlock(blockId: string): Promise<void> {
    return await this.browser.execute((blockId) => {
      const workspaceSvg = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
      const block = workspaceSvg.getBlockById(blockId);
      if (!block) throw new Error(`No block found with ID: ${blockId}.`);
      Blockly.getFocusManager().focusNode(block);
    }, blockId);
  }

  /**
   * Focuses and selects a workspace comment with the provided ID.
   *
   * This throws an error if no workspace comment exists for the specified ID.
   *
   * @param commentId The ID of the workspace comment to select.
   */
  async focusOnWorkspaceComment(commentId: string): Promise<void> {
    return await this.browser.execute((commentId) => {
      const workspaceSvg = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
      const comment = workspaceSvg.getCommentById(commentId);
      if (!comment) {
        throw new Error(`No workspace comment found with ID: ${commentId}.`);
      }
      Blockly.getFocusManager().focusNode(comment);
    }, commentId);
  }

  /**
   * Focuses and selects the field of a block given a block ID and field name.
   *
   * This throws an error if no block exists for the specified ID, or if the
   * block corresponding to the specified ID has no field with the provided
   * name.
   *
   * @param blockId The ID of the block to select.
   * @param fieldName The name of the field on the block to select.
   */
  async focusOnBlockField(blockId: string, fieldName: string): Promise<void> {
    return await this.browser.execute(
      (blockId, fieldName) => {
        const workspaceSvg = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
        const block = workspaceSvg.getBlockById(blockId);
        if (!block) throw new Error(`No block found with ID: ${blockId}.`);
        const field = block.getField(fieldName);
        if (!field) {
          throw new Error(`No field found: ${fieldName} (block ${blockId}).`);
        }
        Blockly.getFocusManager().focusNode(field);
      },
      blockId,
      fieldName,
    );
  }

  /**
   * Get the ID of the node that is currently focused.
   *
   * @returns A Promise that resolves to the ID of the current cursor node.
   */
  async getCurrentFocusNodeId(): Promise<string | undefined> {
    return await this.browser.execute(() => {
      return Blockly.getFocusManager().getFocusedNode()?.getFocusableElement()
        ?.id;
    });
  }

  /**
   * Get the ID of the block that is currently focused.
   *
   * @returns A Promise that resolves to the ID of the currently focused block.
   */
  async getCurrentFocusedBlockId(): Promise<string | undefined> {
    return await this.browser.execute(() => {
      const focusedNode = Blockly.getFocusManager().getFocusedNode();
      if (focusedNode && focusedNode instanceof Blockly.BlockSvg) {
        return focusedNode.id;
      }
      return undefined;
    });
  }

  /**
   * Get the block type of the current focused node.
   *
   * @returns A Promise that resolves to the block type of the current cursor
   *     node, or undefined if the current node is not a block.
   */
  async getFocusedBlockType(): Promise<string | undefined> {
    return await this.browser.execute(() => {
      const focused = Blockly.getFocusManager().getFocusedNode();
      const block = focused as Blockly.BlockSvg | null;
      return block?.type;
    });
  }

  /**
   * Get the field name of the current focused node.
   *
   * @returns A Promise that resolves to the field name of the current focused
   *     node, or undefined if the current node is not a field.
   */
  async getFocusedFieldName(): Promise<string | undefined> {
    return await this.browser.execute(() => {
      const focused = Blockly.getFocusManager().getFocusedNode();
      const field = focused as Blockly.Field | null;
      return field?.name;
    });
  }

  /**
   * Copied from blockly browser test_setup.mjs and amended for typescript
   *
   * @param id The ID of the Blockly block to search for.
   * @returns A Promise that resolves to the root SVG element of the block with
   *     the given ID, as an interactable browser element.
   */
  async getBlockElementById(id: string): Promise<ElementWithId> {
    const elem = this.browser.$(
      `[data-id="${id}"]`,
    ) as unknown as ElementWithId;
    elem['id'] = id;
    return elem;
  }

  /**
   * Uses tabs to navigate to the workspace on the test page (i.e. by going
   * through top-level tab stops).
   *
   * @param hasToolbox Whether a toolbox is configured on the test page.
   * @param hasFlyout Whether a flyout is configured on the test page.
   */
  async tabNavigateToWorkspace(hasToolbox = true, hasFlyout = true) {
    // Navigate past the initial pre-injection focusable div element.
    this.tabNavigateForward();
    if (hasToolbox) this.tabNavigateForward();
    if (hasFlyout) this.tabNavigateForward();
    this.tabNavigateForward(); // Tab to the workspace itself.
  }

  /**
   * Uses tabs to navigate to the toolbox on the test page (i.e. by going
   * through top-level tab stops). Assumes initial load tab position.
   */
  async tabNavigateToToolbox() {
    // Initial pre-injection focusable div element.
    await this.tabNavigateForward();
    // Toolbox.
    await this.tabNavigateForward();
  }

  /** Navigates forward to the test page's next tab stop. */
  async tabNavigateForward() {
    await this.sendKeyAndWait(webdriverio.Key.Tab);
  }

  /** Navigates backward to the test page's previous tab stop. */
  async tabNavigateBackward() {
    await this.sendKeyAndWait([webdriverio.Key.Shift, webdriverio.Key.Tab]);
  }

  /**
   * Sends the keyboard event for arrow key left.
   *
   * @param times The number of times to repeat the key press (default is 1).
   */
  async keyLeft(times = 1) {
    await this.sendKeyAndWait(webdriverio.Key.ArrowLeft, times);
  }

  /**
   * Sends the keyboard event for arrow key right.
   *
   * @param times The number of times to repeat the key press (default is 1).
   */
  async keyRight(times = 1) {
    await this.sendKeyAndWait(webdriverio.Key.ArrowRight, times);
  }

  /**
   * Sends the keyboard event for arrow key up.
   *
   * @param times The number of times to repeat the key press (default is 1).
   */
  async keyUp(times = 1) {
    await this.sendKeyAndWait(webdriverio.Key.ArrowUp, times);
  }

  /**
   * Sends the keyboard event for arrow key down.
   *
   * @param times The number of times to repeat the key press (default is 1).
   */
  async keyDown(times = 1) {
    await this.sendKeyAndWait(webdriverio.Key.ArrowDown, times);
  }

  /**
   * Sends the specified key(s) for the specified number of times,
   * waiting between each key press to allow changes to keep up.
   *
   * @param keys The WebdriverIO representative key value(s) to press.
   * @param times The number of times to repeat the key press (default 1).
   */
  async sendKeyAndWait(keys: string | string[], times = 1) {
    for (let i = 0; i < times; i++) {
      await this.browser.keys(keys);
      await this.pause();
    }
  }

  /** Returns whether there's a drag in progress on the main workspace. */
  async isDragging(): Promise<boolean> {
    return await this.browser.execute(() => {
      const workspaceSvg = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
      return workspaceSvg.isDragging();
    });
  }

  /**
   * Wait for the specified context menu item to exist.
   *
   * @param itemText The display text of the context menu item to click.
   * @param reverse Whether to check for non-existence instead.
   * @return A Promise that resolves when the actions are completed.
   */
  async contextMenuExists(itemText: string, reverse = false): Promise<boolean> {
    const item = this.browser.$(`div=${itemText}`);
    return await item.waitForExist({timeout: 200, reverse: reverse});
  }

  /**
   * Find a clickable element on the block and click it.
   *
   * We can't always use the block's SVG root because clicking will always
   * happen in the middle of the block's bounds (including children) by default,
   * which causes problems if it has holes (e.g. statement inputs). Instead,
   * this tries to get the first text field on the block. It falls back on the
   * block's SVG root.
   *
   * @param blockId The id of the block to click, as an interactable element.
   * @param clickOptions The options to pass to webdriverio's element.click
   *     function.
   * @return A Promise that resolves when the actions are completed.
   */
  async clickBlock(
    blockId: string,
    clickOptions?: Partial<webdriverio.ClickOptions> | undefined,
  ) {
    const findableId = 'clickTargetElement';
    // In the browser context, find the element that we want and give it a
    // findable ID.
    await this.browser.execute(
      (blockId, newElemId) => {
        const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
        const block = ws.getBlockById(blockId) as Blockly.BlockSvg;
        // Ensure the block we want to click is within the viewport.
        ws.scrollBoundsIntoView(
          block.getBoundingRectangleWithoutChildren(),
          10,
        );
        if (!block.isCollapsed()) {
          for (const input of block.inputList) {
            for (const field of input.fieldRow) {
              if (field instanceof Blockly.FieldLabel) {
                const svgRoot = field.getSvgRoot();
                if (svgRoot) {
                  svgRoot.id = newElemId;
                  return;
                }
              }
            }
          }
        }
        // No label field found. Fall back to the block's SVG root.
        block.getSvgRoot().id = newElemId;
      },
      blockId,
      findableId,
    );

    // In the test context, get the Webdriverio Element that we've identified.
    const elem = this.browser.$(`#${findableId}`);

    await elem.click(clickOptions);

    // In the browser context, remove the ID.
    await this.browser.execute((elemId) => {
      document.getElementById(elemId)?.removeAttribute('id');
    }, findableId);
  }
}
