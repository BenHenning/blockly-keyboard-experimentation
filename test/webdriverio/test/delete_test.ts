/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {testFileLocations, testSetup} from './test_setup.js';
import {Key} from 'webdriverio';

suite('Deleting Blocks', function () {
  // Setting timeout to unlimited as these tests take a longer time to run than most mocha test
  this.timeout(0);

  setup(async function () {
    this.testDriver = await testSetup(testFileLocations.NAVIGATION_TEST_BLOCKS);
  });

  test('Deleting block selects parent block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('controls_if_2');

    chai
      .expect(await this.testDriver.blockIsPresent('controls_if_2'))
      .equal(true);

    await this.testDriver.sendKeyAndWait(Key.Backspace);

    chai
      .expect(await this.testDriver.blockIsPresent('controls_if_2'))
      .equal(false);

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .to.include('controls_if_1');
  });

  test('Cutting block selects parent block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('controls_if_2');

    chai
      .expect(await this.testDriver.blockIsPresent('controls_if_2'))
      .equal(true);

    await this.testDriver.sendKeyAndWait([Key.Ctrl, 'x']);

    chai
      .expect(await this.testDriver.blockIsPresent('controls_if_2'))
      .equal(false);

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .to.include('controls_if_1');
  });

  test('Deleting block also deletes children and inputs', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('controls_if_2');

    chai
      .expect(await this.testDriver.blockIsPresent('logic_boolean_1'))
      .equal(true);
    chai.expect(await this.testDriver.blockIsPresent('text_print_1')).equal(true);

    await this.testDriver.sendKeyAndWait(Key.Backspace);

    chai
      .expect(await this.testDriver.blockIsPresent('logic_boolean_1'))
      .equal(false);
    chai
      .expect(await this.testDriver.blockIsPresent('text_print_1'))
      .equal(false);
  });

  test('Cutting block also removes children and inputs', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('controls_if_2');

    chai
      .expect(await this.testDriver.blockIsPresent('logic_boolean_1'))
      .equal(true);
    chai.expect(await this.testDriver.blockIsPresent('text_print_1')).equal(true);

    await this.testDriver.sendKeyAndWait([Key.Ctrl, 'x']);

    chai
      .expect(await this.testDriver.blockIsPresent('logic_boolean_1'))
      .equal(false);
    chai
      .expect(await this.testDriver.blockIsPresent('text_print_1'))
      .equal(false);
  });

  test('Deleting inline input selects parent block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('logic_boolean_1');

    chai
      .expect(await this.testDriver.blockIsPresent('logic_boolean_1'))
      .equal(true);

    await this.testDriver.sendKeyAndWait(Key.Backspace);

    chai
      .expect(await this.testDriver.blockIsPresent('logic_boolean_1'))
      .equal(false);

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .to.include('controls_if_2');
  });

  test('Cutting inline input selects parent block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('logic_boolean_1');

    chai
      .expect(await this.testDriver.blockIsPresent('logic_boolean_1'))
      .equal(true);

    await this.testDriver.sendKeyAndWait([Key.Ctrl, 'x']);

    chai
      .expect(await this.testDriver.blockIsPresent('logic_boolean_1'))
      .equal(false);

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .to.include('controls_if_2');
  });

  test('Deleting stranded block selects top block', async function () {
    // Deleting a stranded block should result in the workspace being
    // focused, which then focuses the top block. If that
    // behavior ever changes, this test should be updated as well.
    // We want deleting a block to focus the workspace, whatever that
    // means at the time.
    await this.testDriver.tabNavigateToWorkspace();

    // The test workspace doesn't already contain a stranded block, so add one.
    await this.testDriver.moveToToolboxCategory('Math');
    // Move to flyout.
    await this.testDriver.keyRight();
    // Select number block.
    await this.testDriver.sendKeyAndWait(Key.Enter);
    // Confirm move.
    await this.testDriver.sendKeyAndWait(Key.Enter);

    chai.assert.equal('math_number', await this.testDriver.getFocusedBlockType());

    await this.testDriver.sendKeyAndWait(Key.Backspace);

    chai.assert.equal(
      await this.testDriver.getCurrentFocusedBlockId(),
      'p5_setup_1',
    );
  });

  test('Cutting stranded block selects top block', async function () {
    await this.testDriver.tabNavigateToWorkspace();

    // The test workspace doesn't already contain a stranded block, so add one.
    await this.testDriver.moveToToolboxCategory('Math');
    // Move to flyout.
    await this.testDriver.keyRight();
    // Select number block.
    await this.testDriver.sendKeyAndWait(Key.Enter);
    // Confirm move.
    await this.testDriver.sendKeyAndWait(Key.Enter);

    chai.assert.equal('math_number', await this.testDriver.getFocusedBlockType());

    await this.testDriver.sendKeyAndWait([Key.Ctrl, 'x']);

    chai.assert.equal(
      await this.testDriver.getCurrentFocusedBlockId(),
      'p5_setup_1',
    );
  });

  test('Do not delete block while field editor is open', async function () {
    // Open a field editor
    await this.testDriver.focusOnBlockField('colour_picker_1', 'COLOUR');
    await this.testDriver.sendKeyAndWait(Key.Enter);

    // Try to delete block while field editor is open
    await this.testDriver.sendKeyAndWait(Key.Backspace);

    // Block is not deleted
    chai.assert.isTrue(await this.testDriver.blockIsPresent('colour_picker_1'));
  });
});
