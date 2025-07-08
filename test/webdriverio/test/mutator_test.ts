/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import * as Blockly from 'blockly';
import {TestPlayground, testSetup} from './test_setup.js';
import {Key} from 'webdriverio';

suite('Mutator navigation', function () {
  // Setting timeout to unlimited as these tests take a longer time to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  setup(async function () {
    this.driver = await testSetup(TestPlayground.NAVIGATION_TEST_BLOCKS);
    this.openMutator = async () => {
      await this.driver.tabNavigateToWorkspace();
      await this.driver.focusOnBlock('controls_if_1');
      // Navigate to the mutator icon
      await this.driver.keyRight();
      // Activate the icon
      await this.driver.sendKeyAndWait(Key.Enter);
    };
  });

  test('Enter opens mutator', async function () {
    await this.openMutator();

    // Main workspace should not be focused (because mutator workspace is)
    const mainWorkspaceFocused = await this.driver.focusedTreeIsMainWorkspace();
    chai.assert.isFalse(mainWorkspaceFocused);

    // The "if" placeholder block in the mutator should be focused
    const focusedBlockType = await this.driver.getFocusedBlockType();
    chai.assert.equal(focusedBlockType, 'controls_if_if');
  });

  test('Escape dismisses mutator', async function () {
    await this.openMutator();
    await this.driver.sendKeyAndWait(Key.Escape);

    // Main workspace should be the focused tree (since mutator workspace is gone)
    const mainWorkspaceFocused = await this.driver.focusedTreeIsMainWorkspace();
    chai.assert.isTrue(mainWorkspaceFocused);

    const mutatorIconId = await this.driver.browser.execute(() => {
      const block = Blockly.getMainWorkspace().getBlockById('controls_if_1');
      const icon = block?.getIcon(Blockly.icons.IconType.MUTATOR);
      return icon?.getFocusableElement().id;
    });

    // Mutator icon should now be focused
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(mutatorIconId, focusedNodeId);
  });

  test('Escape in the mutator flyout focuses the mutator workspace', async function () {
    await this.openMutator();
    // Focus the flyout
    await this.driver.sendKeyAndWait('t');
    // Hit escape to return focus to the mutator workspace
    await this.driver.sendKeyAndWait(Key.Escape);
    // The "if" placeholder block in the mutator should be focused
    const focusedBlockType = await this.driver.getFocusedBlockType();
    chai.assert.equal(focusedBlockType, 'controls_if_if');
  });

  test('T focuses the mutator flyout', async function () {
    await this.openMutator();
    await this.driver.sendKeyAndWait('t');

    // The "else if" block in the mutator flyout should be focused
    const focusedBlockType = await this.driver.getFocusedBlockType();
    chai.assert.equal(focusedBlockType, 'controls_if_elseif');
  });

  test('Blocks can be inserted from the mutator flyout', async function () {
    await this.openMutator();
    await this.driver.sendKeyAndWait('t');
    // Navigate down to the second block in the flyout
    await this.driver.keyDown();
    // Hit enter to enter insert mode
    await this.driver.sendKeyAndWait(Key.Enter);
    // Hit enter again to lock it into place on the connection
    await this.driver.sendKeyAndWait(Key.Enter);

    const topBlocks = await this.driver.browser.execute(() => {
      const focusedTree = Blockly.getFocusManager().getFocusedTree();
      if (!(focusedTree instanceof Blockly.WorkspaceSvg)) {
        throw new Error('Focused tree is not a workspace.');
      }

      return focusedTree.getAllBlocks(true).map((block) => block.type);
    });

    chai.assert.deepEqual(topBlocks, ['controls_if_if', 'controls_if_else']);
  });
});
