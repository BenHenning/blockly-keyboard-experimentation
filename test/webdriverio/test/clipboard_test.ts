/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import * as Blockly from 'blockly';
import {
  testSetup,
  ElementWithId,
  TestDriver,
  TestPlayground,
} from './test_setup.js';
import {Key, KeyAction, PointerAction, WheelAction} from 'webdriverio';

suite('Clipboard test', function () {
  // Setting timeout to unlimited as these tests take longer time to run
  this.timeout(0);

  // Clear the workspace and load start blocks
  setup(async function () {
    this.driver = await testSetup(TestPlayground.BASE);
  });

  test('Copy and paste while block selected', async function () {
    // Navigate to draw_circle_1.
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('draw_circle_1');

    // Copy and paste
    await this.driver.sendKeyAndWait([Key.Ctrl, 'c']);
    await this.driver.sendKeyAndWait([Key.Ctrl, 'v']);

    const block = await this.driver.getBlockElementById('draw_circle_1');
    const blocks = await getSameBlocks(this.driver.browser, block);
    const selectedId = await this.driver.getSelectedBlockId();
    chai.assert.equal(await blocks.length, 2);
    chai.assert.equal(
      selectedId,
      await blocks[1].getAttribute('data-id'),
      'New copy of block should be selected and postioned after the copied one',
    );
  });

  test('Cut and paste while block selected', async function () {
    // Navigate to draw_circle_1.
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('draw_circle_1');
    const block = await this.driver.getBlockElementById('draw_circle_1');

    // Cut and paste
    await this.driver.sendKeyAndWait([Key.Ctrl, 'x']);
    await block.waitForExist({reverse: true});
    await this.driver.sendKeyAndWait([Key.Ctrl, 'v']);
    await block.waitForExist();

    const blocks = await getSameBlocks(this.driver.browser, block);
    const selectedId = await this.driver.getSelectedBlockId();

    chai.assert.equal(await blocks.length, 1);
    chai.assert.equal(selectedId, await blocks[0].getAttribute('data-id'));
  });

  test('Copy and paste whilst dragging block', async function () {
    const initialWsBlocks = await serializeWorkspaceBlocks(this.driver.browser);

    // Simultaneously drag block and Ctrl+C then Ctrl+V
    await performActionWhileDraggingBlock(
      this.driver,
      await this.driver.getBlockElementById('draw_circle_1'),
      this.driver.browser
        .action('key')
        .down(Key.Ctrl)
        .down('c')
        .up(Key.Ctrl)
        .up('c')
        .down(Key.Ctrl)
        .down('v')
        .up(Key.Ctrl)
        .up('v'),
    );

    chai.assert.deepEqual(
      initialWsBlocks,
      await serializeWorkspaceBlocks(this.driver.browser),
      'Blocks on the workspace should not have changed',
    );
  });

  test('Cut whilst dragging block', async function () {
    const initialWsBlocks = await serializeWorkspaceBlocks(this.driver.browser);

    // Simultaneously drag block and Ctrl+X
    await performActionWhileDraggingBlock(
      this.driver,
      await this.driver.getBlockElementById('draw_circle_1'),
      this.driver.browser
        .action('key')
        .down(Key.Ctrl)
        .down('x')
        .up(Key.Ctrl)
        .up('x'),
    );

    chai.assert.deepEqual(
      initialWsBlocks,
      await serializeWorkspaceBlocks(this.driver.browser),
      'Blocks on the workspace should not have changed',
    );
  });

  test('Do not cut block while field editor is open', async function () {
    // Open a field editor
    await this.driver.focusOnBlockField('draw_circle_1_color', 'COLOUR');
    await this.driver.sendKeyAndWait(Key.Enter);

    // Try to cut block while field editor is open
    await this.driver.sendKeyAndWait([Key.Ctrl, 'x']);

    // Block is not deleted
    chai.assert.isTrue(await this.driver.blockIsPresent('draw_circle_1_color'));
  });
});

/**
 * Gets blocks that are the same as the reference block in terms of class
 * they contain.
 *
 * @param browser The active WebdriverIO Browser object.
 * @param block The reference element.
 * @returns A Promise that resolves to blocks that are the same as the reference block.
 */
async function getSameBlocks(
  browser: WebdriverIO.Browser,
  block: ElementWithId,
) {
  const elClass = await block.getAttribute('class');
  return browser.$$(`.${elClass.split(' ').join('.')}`);
}

/**
 * Perform actions whilst dragging a given block around.
 *
 * @param driver The active TestDriver.
 * @param blockToDrag The block to drag around.
 * @param action Action to perform whilst dragging block.
 * @returns A Promise that resolves once action completes.
 */
async function performActionWhileDraggingBlock(
  driver: TestDriver,
  blockToDrag: ElementWithId,
  action: KeyAction | PointerAction | WheelAction,
) {
  const blockLoc = await blockToDrag.getLocation();
  const blockX = Math.round(blockLoc.x);
  const blockY = Math.round(blockLoc.y);
  await driver.browser.actions([
    driver.browser
      .action('pointer')
      .move(blockX, blockY)
      .down()
      .move(blockX + 20, blockY + 20)
      .move(blockX, blockY),
    action,
  ]);
  await driver.pause();
}

/**
 * Serializes workspace blocks into JSON objects.
 *
 * @param browser The active WebdriverIO Browser object.
 * @returns A Promise that resolves to serialization of workspace blocks.
 */
async function serializeWorkspaceBlocks(browser: WebdriverIO.Browser) {
  return await browser.execute(() => {
    return Blockly.serialization.workspaces.save(Blockly.getMainWorkspace());
  });
}
