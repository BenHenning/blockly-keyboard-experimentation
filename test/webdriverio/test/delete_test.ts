/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {TestPlayground, testSetup} from './test_setup.js';
import {Key} from 'webdriverio';

suite('Deleting Blocks', function () {
  // Setting timeout to unlimited as these tests take a longer time to run than most mocha test
  this.timeout(0);

  setup(async function () {
    this.driver = await testSetup(TestPlayground.NAVIGATION_TEST_BLOCKS);
  });

  test('Deleting block selects parent block', async function () {
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('controls_if_2');

    chai.expect(await this.driver.blockIsPresent('controls_if_2')).equal(true);

    await this.driver.sendKeyAndWait(Key.Backspace);

    chai.expect(await this.driver.blockIsPresent('controls_if_2')).equal(false);

    chai
      .expect(await this.driver.getCurrentFocusedBlockId())
      .to.include('controls_if_1');
  });

  test('Cutting block selects parent block', async function () {
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('controls_if_2');

    chai.expect(await this.driver.blockIsPresent('controls_if_2')).equal(true);

    await this.driver.sendKeyAndWait([Key.Ctrl, 'x']);

    chai.expect(await this.driver.blockIsPresent('controls_if_2')).equal(false);

    chai
      .expect(await this.driver.getCurrentFocusedBlockId())
      .to.include('controls_if_1');
  });

  test('Deleting block also deletes children and inputs', async function () {
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('controls_if_2');

    chai
      .expect(await this.driver.blockIsPresent('logic_boolean_1'))
      .equal(true);
    chai.expect(await this.driver.blockIsPresent('text_print_1')).equal(true);

    await this.driver.sendKeyAndWait(Key.Backspace);

    chai
      .expect(await this.driver.blockIsPresent('logic_boolean_1'))
      .equal(false);
    chai.expect(await this.driver.blockIsPresent('text_print_1')).equal(false);
  });

  test('Cutting block also removes children and inputs', async function () {
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('controls_if_2');

    chai
      .expect(await this.driver.blockIsPresent('logic_boolean_1'))
      .equal(true);
    chai.expect(await this.driver.blockIsPresent('text_print_1')).equal(true);

    await this.driver.sendKeyAndWait([Key.Ctrl, 'x']);

    chai
      .expect(await this.driver.blockIsPresent('logic_boolean_1'))
      .equal(false);
    chai.expect(await this.driver.blockIsPresent('text_print_1')).equal(false);
  });

  test('Deleting inline input selects parent block', async function () {
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('logic_boolean_1');

    chai
      .expect(await this.driver.blockIsPresent('logic_boolean_1'))
      .equal(true);

    await this.driver.sendKeyAndWait(Key.Backspace);

    chai
      .expect(await this.driver.blockIsPresent('logic_boolean_1'))
      .equal(false);

    chai
      .expect(await this.driver.getCurrentFocusedBlockId())
      .to.include('controls_if_2');
  });

  test('Cutting inline input selects parent block', async function () {
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('logic_boolean_1');

    chai
      .expect(await this.driver.blockIsPresent('logic_boolean_1'))
      .equal(true);

    await this.driver.sendKeyAndWait([Key.Ctrl, 'x']);

    chai
      .expect(await this.driver.blockIsPresent('logic_boolean_1'))
      .equal(false);

    chai
      .expect(await this.driver.getCurrentFocusedBlockId())
      .to.include('controls_if_2');
  });

  test('Deleting stranded block selects top block', async function () {
    // Deleting a stranded block should result in the workspace being
    // focused, which then focuses the top block. If that
    // behavior ever changes, this test should be updated as well.
    // We want deleting a block to focus the workspace, whatever that
    // means at the time.
    await this.driver.tabNavigateToWorkspace();

    // The test workspace doesn't already contain a stranded block, so add one.
    await this.driver.moveToToolboxCategory('Math');
    // Move to flyout.
    await this.driver.keyRight();
    // Select number block.
    await this.driver.sendKeyAndWait(Key.Enter);
    // Confirm move.
    await this.driver.sendKeyAndWait(Key.Enter);

    chai.assert.equal('math_number', await this.driver.getFocusedBlockType());

    await this.driver.sendKeyAndWait(Key.Backspace);

    chai.assert.equal(
      await this.driver.getCurrentFocusedBlockId(),
      'p5_setup_1',
    );
  });

  test('Cutting stranded block selects top block', async function () {
    await this.driver.tabNavigateToWorkspace();

    // The test workspace doesn't already contain a stranded block, so add one.
    await this.driver.moveToToolboxCategory('Math');
    // Move to flyout.
    await this.driver.keyRight();
    // Select number block.
    await this.driver.sendKeyAndWait(Key.Enter);
    // Confirm move.
    await this.driver.sendKeyAndWait(Key.Enter);

    chai.assert.equal('math_number', await this.driver.getFocusedBlockType());

    await this.driver.sendKeyAndWait([Key.Ctrl, 'x']);

    chai.assert.equal(
      await this.driver.getCurrentFocusedBlockId(),
      'p5_setup_1',
    );
  });

  test('Do not delete block while field editor is open', async function () {
    // Open a field editor
    await this.driver.focusOnBlockField('colour_picker_1', 'COLOUR');
    await this.driver.sendKeyAndWait(Key.Enter);

    // Try to delete block while field editor is open
    await this.driver.sendKeyAndWait(Key.Backspace);

    // Block is not deleted
    chai.assert.isTrue(await this.driver.blockIsPresent('colour_picker_1'));
  });
});
