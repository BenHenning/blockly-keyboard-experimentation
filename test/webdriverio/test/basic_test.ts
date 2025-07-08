/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import * as Blockly from 'blockly';
import {testFileLocations, testSetup} from './test_setup.js';
import {Key} from 'webdriverio';

suite('Keyboard navigation on Blocks', function () {
  // Setting timeout to unlimited as these tests take a longer time to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  suiteSetup(async function () {
    this.testDriver = await testSetup(testFileLocations.NAVIGATION_TEST_BLOCKS);
  });

  test('Default workspace', async function () {
    const blockCount = await this.testDriver.browser.execute(() => {
      return Blockly.getMainWorkspace().getAllBlocks(false).length;
    });

    chai.assert.equal(blockCount, 16);
  });

  test('Selected block', async function () {
    await this.testDriver.tabNavigateToWorkspace();

    await this.testDriver.keyDown(14);

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('controls_if_2');
  });

  test('Down from statement block selects next block across stacks', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('p5_canvas_1');
    await this.testDriver.keyDown();

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('p5_draw_1');
  });

  test('Up from statement block selects previous block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('simple_circle_1');
    await this.testDriver.keyUp();

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('draw_emoji_1');
  });

  test('Down from parent block selects first child block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('p5_setup_1');
    await this.testDriver.keyDown();
    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('p5_canvas_1');
  });

  test('Up from child block selects parent block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('p5_canvas_1');
    await this.testDriver.keyUp();
    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('p5_setup_1');
  });

  test('Right from block selects first field', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('p5_canvas_1');
    await this.testDriver.keyRight();

    chai
      .expect(await this.testDriver.getCurrentFocusNodeId())
      .to.include('p5_canvas_1_field_');

    chai.assert.equal(await this.testDriver.getFocusedFieldName(), 'WIDTH');
  });

  test('Right from block selects first inline input', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('simple_circle_1');
    await this.testDriver.keyRight();

    chai.assert.equal(
      await this.testDriver.getCurrentFocusedBlockId(),
      'colour_picker_1',
    );
  });

  test('Up from inline input selects statement block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('math_number_2');
    await this.testDriver.keyUp();

    chai.assert.equal(
      await this.testDriver.getCurrentFocusedBlockId(),
      'controls_repeat_ext_1',
    );
  });

  test('Left from first inline input selects block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('math_number_2');
    await this.testDriver.keyLeft();

    chai.assert.equal(
      await this.testDriver.getCurrentFocusedBlockId(),
      'math_modulo_1',
    );
  });

  test('Right from first inline input selects second inline input', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('math_number_2');
    await this.testDriver.keyRight();

    chai.assert.equal(
      await this.testDriver.getCurrentFocusedBlockId(),
      'math_number_3',
    );
  });

  test('Left from second inline input selects first inline input', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('math_number_3');
    await this.testDriver.keyLeft();

    chai.assert.equal(
      await this.testDriver.getCurrentFocusedBlockId(),
      'math_number_2',
    );
  });

  test('Right from last inline input selects next block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('colour_picker_1');
    await this.testDriver.keyRight();

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('controls_repeat_ext_1');
  });

  test('Down from inline input selects next block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('colour_picker_1');
    await this.testDriver.keyDown();

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('controls_repeat_ext_1');
  });

  test("Down from inline input selects block's child block", async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('logic_boolean_1');
    await this.testDriver.keyDown();

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('text_print_1');
  });

  test('Right from text block selects shadow block then field', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('text_print_1');
    await this.testDriver.keyRight();

    chai.assert.equal(await this.testDriver.getCurrentFocusedBlockId(), 'text_1');

    await this.testDriver.keyRight();

    chai
      .expect(await this.testDriver.getCurrentFocusNodeId())
      .to.include('text_1_field_');

    await this.testDriver.keyRight();

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('controls_repeat_1');
  });

  test('Losing focus cancels move', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('text_print_1');
    await this.testDriver.sendKeyAndWait('m');

    chai.assert.isTrue(await this.testDriver.isDragging());

    await this.testDriver.tabNavigateForward();

    chai.assert.isFalse(await this.testDriver.isDragging());
  });
});

suite('Keyboard navigation on Fields', function () {
  // Setting timeout to unlimited as these tests take a longer time to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  suiteSetup(async function () {
    this.testDriver = await testSetup(testFileLocations.NAVIGATION_TEST_BLOCKS);
  });

  test('Up from first field selects block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlockField('p5_canvas_1', 'WIDTH');
    await this.testDriver.keyUp();

    chai.assert.equal(
      await this.testDriver.getCurrentFocusedBlockId(),
      'p5_canvas_1',
    );
  });

  test('Left from first field selects block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlockField('p5_canvas_1', 'WIDTH');
    await this.testDriver.keyLeft();

    chai.assert.equal(
      await this.testDriver.getCurrentFocusedBlockId(),
      'p5_canvas_1',
    );
  });

  test('Right from first field selects second field', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlockField('p5_canvas_1', 'WIDTH');
    await this.testDriver.keyRight();

    chai
      .expect(await this.testDriver.getCurrentFocusNodeId())
      .to.include('p5_canvas_1_field_');

    chai.assert.equal(await this.testDriver.getFocusedFieldName(), 'HEIGHT');
  });

  test('Left from second field selects first field', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlockField('p5_canvas_1', 'HEIGHT');
    await this.testDriver.keyLeft();

    chai
      .expect(await this.testDriver.getCurrentFocusNodeId())
      .to.include('p5_canvas_1_field_');

    chai.assert.equal(await this.testDriver.getFocusedFieldName(), 'WIDTH');
  });

  test('Right from second field selects next block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlockField('p5_canvas_1', 'HEIGHT');
    await this.testDriver.keyRight();

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('p5_draw_1');
  });

  test('Down from field selects next block', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlockField('p5_canvas_1', 'WIDTH');
    await this.testDriver.keyDown();

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('p5_draw_1');
  });

  test("Down from field selects block's child block", async function () {
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlockField('controls_repeat_1', 'TIMES');
    await this.testDriver.keyDown();

    chai
      .expect(await this.testDriver.getCurrentFocusedBlockId())
      .equal('draw_emoji_1');
  });

  test('Do not navigate while field editor is open', async function () {
    // Open a field editor dropdown
    await this.testDriver.focusOnBlockField('logic_boolean_1', 'BOOL');
    await this.testDriver.sendKeyAndWait(Key.Enter);

    // Try to navigate to a different block
    await this.testDriver.keyRight();

    // The same field should still be focused
    chai.assert.equal(await this.testDriver.getFocusedFieldName(), 'BOOL');
  });

  test('Do not reopen field editor when handling enter to make a choice inside the editor', async function () {
    // Open colour picker
    await this.testDriver.focusOnBlockField('colour_picker_1', 'COLOUR');
    await this.testDriver.sendKeyAndWait(Key.Enter);

    // Move right to pick a new colour.
    await this.testDriver.keyRight();
    // Enter to choose.
    await this.testDriver.sendKeyAndWait(Key.Enter);

    // Focus seems to take longer than a single pause to settle.
    await this.testDriver.browser.waitUntil(
      () =>
        this.testDriver.browser.execute(() =>
          document.activeElement?.classList.contains('blocklyActiveFocus'),
        ),
      {timeout: 1000},
    );
  });
});
