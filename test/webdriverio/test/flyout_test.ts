/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import * as Blockly from 'blockly';
import {testFileLocations, testSetup} from './test_setup.js';

suite('Toolbox and flyout test', function () {
  // Clear the workspace and load start blocks
  setup(async function () {
    this.testDriver = await testSetup(testFileLocations.BASE);
  });

  test('Tab navigating to toolbox should open flyout', async function () {
    // Two tabs should navigate to the toolbox (initial element is skipped).
    await this.testDriver.tabNavigateForward();

    await this.testDriver.tabNavigateForward();

    // The flyout should now be open.
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.isTrue(flyoutIsOpen);
  });

  test('Tab navigating to flyout should auto-select first block', async function () {
    // Three tabs should navigate to the flyout (initial element is skipped).
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    await this.testDriver.tabNavigateForward();

    // The top block of the category should be automatically selected. See:
    // https://github.com/google/blockly/issues/8978.
    const blockId = await this.testDriver.getCurrentFocusedBlockId();
    chai.assert.strictEqual(blockId, 'if_block');
  });

  test('Tab navigating to toolbox then right arrow key should auto-select first block in flyout', async function () {
    // Two tabs should navigate to the toolbox (initial element is skipped). One
    // right arrow key should select a block on the flyout.
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    await this.testDriver.keyRight();

    // The top block of the category should be automatically selected. See:
    // https://github.com/google/blockly/issues/8978.
    const blockId = await this.testDriver.getCurrentFocusedBlockId();
    chai.assert.strictEqual(blockId, 'if_block');
  });

  test('Keyboard nav to different toolbox category should auto-select first block', async function () {
    // Two tabs should navigate to the toolbox (initial element is skipped),
    // then keys for a different category with a tab to select the flyout.
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    await this.testDriver.keyDown(3);
    await this.testDriver.tabNavigateForward();

    // The top block of the category should be automatically selected.
    const blockId = await this.testDriver.getCurrentFocusedBlockId();
    chai.assert.strictEqual(blockId, 'text_block');
  });

  test('Keyboard nav to different toolbox category and block should select different block', async function () {
    // Two tabs should navigate to the toolbox (initial element is skipped),
    // then keys for a different category with a tab to select the flyout and
    // finally keys to select a different block.
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    await this.testDriver.keyDown(3);
    await this.testDriver.tabNavigateForward();
    await this.testDriver.keyDown(2);

    // A non-top blockshould be manually selected.
    const blockId = await this.testDriver.getCurrentFocusedBlockId();
    chai.assert.strictEqual(blockId, 'append_text_block');
  });

  test('Tab navigate away from toolbox restores focus to initial element', async function () {
    // Two tabs should navigate to the toolbox. One tab back should leave it.
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    await this.testDriver.tabNavigateBackward();

    // Focus should restore to the initial div element. See:
    // https://github.com/google/blockly-keyboard-experimentation/issues/523.
    const activeElementId = await this.testDriver.browser.execute(
      () => document.activeElement?.id,
    );
    chai.assert.strictEqual(activeElementId, 'focusableDiv');
  });

  test('Tab navigate away from toolbox closes flyout', async function () {
    // Two tabs should navigate to the toolbox. One tab back should leave it.
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    await this.testDriver.tabNavigateBackward();

    // The flyout should be closed since the toolbox lost focus. See:
    // https://github.com/google/blockly/issues/8970.
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.isFalse(flyoutIsOpen);
  });

  test('Tab navigate away from flyout to toolbox and away closes flyout', async function () {
    // Three tabs should navigate to the flyout, and two tabs back should close.
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    await this.testDriver.tabNavigateBackward();
    await this.testDriver.tabNavigateBackward();

    // The flyout should be closed since the toolbox lost focus.
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.isFalse(flyoutIsOpen);
  });

  test('Tabbing to the workspace should close the flyout', async function () {
    await this.testDriver.tabNavigateToWorkspace();

    // The flyout should be closed since it lost focus.
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.isFalse(flyoutIsOpen);
  });

  test('Tabbing to the workspace after selecting flyout block should close the flyout', async function () {
    // Two tabs should navigate to the toolbox (initial element is skipped),
    // then use right key to specifically navigate into the flyout before
    // navigating to the workspace.
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    await this.testDriver.keyRight();
    await this.testDriver.tabNavigateForward();

    // The flyout should be closed since it lost focus. See:
    // https://github.com/google/blockly-keyboard-experimentation/issues/547.
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.isFalse(flyoutIsOpen);
  });

  test('Tabbing to the workspace after selecting flyout block via workspace toolbox shortcut should close the flyout', async function () {
    await this.testDriver.tabNavigateToWorkspace();

    await this.testDriver.sendKeyAndWait('t');
    await this.testDriver.keyRight();
    await this.testDriver.tabNavigateForward();

    // The flyout should now be closed and unfocused. See:
    // https://github.com/google/blockly/pull/9079#issuecomment-2913759646.
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.isFalse(flyoutIsOpen);
  });

  test('Tabbing back from workspace should reopen the flyout', async function () {
    await this.testDriver.tabNavigateToWorkspace();

    await this.testDriver.tabNavigateBackward();

    // The flyout should be open again since the toolbox is again focused. See:
    // https://github.com/google/blockly/issues/8965.
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.isTrue(flyoutIsOpen);
  });

  test('Navigation position in workspace should be retained when tabbing to flyout and back', async function () {
    // Navigate to the workspace and select a non-default block.
    await this.testDriver.tabNavigateToWorkspace();

    // Note that two tabs are needed here to move past the flyout.
    await this.testDriver.keyDown(3);
    await this.testDriver.tabNavigateBackward();
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    // The previously selected block should be retained upon returning. See:
    // https://github.com/google/blockly/issues/8965#issuecomment-2900479280.
    const blockId = await this.testDriver.getCurrentFocusedBlockId();
    chai.assert.strictEqual(blockId, 'p5_draw_1');
  });

  test('Clicking outside Blockly with focused toolbox closes the flyout', async function () {
    // Two tabs should navigate to the toolbox. One click to unfocus.
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();

    const elem = this.testDriver.browser.$('#focusableDiv');
    await elem.click();

    // The flyout should be closed due to clicking an outside element.
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.isFalse(flyoutIsOpen);
  });

  test('Clicking outside Blockly with focused flyout closes the flyout', async function () {
    // Two tabs should navigate to the toolbox. One key to select the flyout.
    await this.testDriver.tabNavigateForward();
    await this.testDriver.tabNavigateForward();
    await this.testDriver.keyRight();

    const elem = this.testDriver.browser.$('#focusableDiv');
    await elem.click();

    // The flyout should be closed due to clicking an outside element. See:
    // https://github.com/google/blockly/pull/9079#issuecomment-2914628810.
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.isFalse(flyoutIsOpen);
  });

  test('Clicking on toolbox category focuses it and opens flyout', async function () {
    const elemId =
      await findToolboxCategoryIdByName(this.testDriver.browser, 'Loops');
    const elem = this.testDriver.browser.$(`#${elemId}`);
    await elem.click();

    // The clicked category should now be focused.
    const focusedId = await this.testDriver.getCurrentFocusNodeId();
    const flyoutIsOpen = await checkIfFlyoutIsOpen(this.testDriver.browser);
    chai.assert.strictEqual(focusedId, elemId);
    chai.assert.isTrue(flyoutIsOpen);
  });
});

/**
 * Checks if the flyout is currently open.
 *
 * This throws an error if the current main workspace has no flyout.
 *
 * @param browser The active WebdriverIO Browser object.
 * @returns A promise indicating whether the flyout is currently open.
 */
async function checkIfFlyoutIsOpen(
  browser: WebdriverIO.Browser,
): Promise<boolean> {
  return await browser.execute(() => {
    const workspaceSvg = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
    const flyout = workspaceSvg.getFlyout();
    if (!flyout) throw new Error('Workspace has no flyout.');
    return flyout.isVisible();
  });
}

/**
 * Finds the element ID of the toolbox category with the specified name.
 *
 * This throws an error if the current main workspace has no toolbox or the
 * toolbox does not have a category with the specified name.
 *
 * @param browser The active WebdriverIO Browser object.
 * @param name The name of the category to find.
 * @returns A promise with the focusable element ID of the sought category.
 */
async function findToolboxCategoryIdByName(
  browser: WebdriverIO.Browser,
  name: string,
): Promise<string> {
  return await browser.execute((name) => {
    const workspaceSvg = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
    const toolbox = workspaceSvg.getToolbox() as Blockly.Toolbox;
    if (!toolbox) throw new Error('Workspace has no toolbox.');

    for (const item of toolbox.getToolboxItems()) {
      if (item instanceof Blockly.ToolboxCategory && item.getName() === name) {
        return item.getFocusableElement().id;
      }
    }

    throw new Error(`No category found with name: ${name}.`);
  }, name);
}
