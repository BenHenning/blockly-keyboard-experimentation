/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import * as chai from 'chai';
import {testFileLocations, testSetup} from './test_setup.js';

suite('Duplicate test', function () {
  // Setting timeout to unlimited as these tests take longer time to run
  this.timeout(0);

  // Clear the workspace and load start blocks
  setup(async function () {
    this.testDriver = await testSetup(testFileLocations.BASE);
  });

  test('Duplicate block', async function () {
    // Navigate to draw_circle_1.
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('draw_circle_1');

    // Duplicate
    await this.testDriver.sendKeyAndWait('d');

    // Check a different block of the same type has focus.
    chai.assert.notEqual(
      'draw_circle_1',
      await this.testDriver.getCurrentFocusedBlockId(),
    );
    chai.assert.equal('simple_circle', await this.testDriver.getFocusedBlockType());
  });

  test('Duplicate workspace comment', async function () {
    await this.testDriver.tabNavigateToWorkspace();
    const text = 'A comment with text';

    // Create a single comment.
    await this.testDriver.browser.execute((text: string) => {
      const workspace = Blockly.getMainWorkspace();
      Blockly.serialization.workspaceComments.append(
        {
          text,
          x: 200,
          y: 200,
        },
        workspace,
      );
      Blockly.getFocusManager().focusNode(
        (workspace as Blockly.WorkspaceSvg).getTopComments()[0],
      );
    }, text);
    await this.testDriver.pause();

    // Duplicate.
    await this.testDriver.sendKeyAndWait('d');

    // Assert we have two comments with the same text.
    const commentTexts = await this.testDriver.browser.execute(() =>
      Blockly.getMainWorkspace()
        .getTopComments(true)
        .map((comment) => comment.getText()),
    );
    chai.assert.deepEqual(commentTexts, [text, text]);
    // Assert it's the duplicate that is focused (positioned below).
    const [comment1, comment2] = await this.testDriver.browser.$$('.blocklyComment');
    chai.assert.isTrue(await comment2.isFocused());
    chai.assert.isTrue(
      (await comment2.getLocation()).y > (await comment1.getLocation()).y,
    );
  });
});
