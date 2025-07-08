/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {testFileLocations, testSetup} from './test_setup.js';

suite('Insert test', function () {
  // Setting timeout to unlimited as these tests take longer time to run
  this.timeout(0);

  // Clear the workspace and load start blocks
  setup(async function () {
    this.testDriver = await testSetup(testFileLocations.BASE);
  });

  test('Insert and cancel with block selection', async function () {
    // Navigate to draw_circle_1.
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('draw_circle_1');
    // Insert 'if' block
    await this.testDriver.sendKeyAndWait('t');
    await this.testDriver.keyRight();
    await this.testDriver.sendKeyAndWait(Key.Enter);
    chai.assert.equal('controls_if', await this.testDriver.getFocusedBlockType());
    const ifId = await this.testDriver.getCurrentFocusedBlockId();
    chai.assert.ok(ifId);

    // Cancel
    await this.testDriver.sendKeyAndWait(Key.Escape);

    chai.assert.isFalse(await this.testDriver.blockIsPresent(ifId));
  });

  test('Insert and cancel with workspace selection', async function () {
    // Navigate to workspace.
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.sendKeyAndWait('w');
    // Insert 'if' block
    await this.testDriver.sendKeyAndWait('t');
    await this.testDriver.keyRight();
    await this.testDriver.sendKeyAndWait(Key.Enter);
    chai.assert.equal('controls_if', await this.testDriver.getFocusedBlockType());
    const ifId = await this.testDriver.getCurrentFocusedBlockId();
    chai.assert.ok(ifId);

    // Cancel
    await this.testDriver.sendKeyAndWait(Key.Escape);

    chai.assert.isFalse(await this.testDriver.blockIsPresent(ifId));
  });

  test('Insert C-shaped block with statement block selected', async function () {
    // Navigate to draw_circle_1.
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('draw_circle_1');

    await this.testDriver.moveToToolboxCategory('Functions');
    // Move to flyout.
    await this.testDriver.keyRight();
    // Select Function block.
    await this.testDriver.sendKeyAndWait(Key.Enter);
    // Confirm move.
    await this.testDriver.sendKeyAndWait(Key.Enter);

    chai.assert.equal(
      'procedures_defnoreturn',
      await this.testDriver.getFocusedBlockType(),
    );
  });

  test('Insert without having focused the workspace', async function () {
    await this.testDriver.tabNavigateToToolbox();

    // Insert 'if' block
    await this.testDriver.keyRight();
    // Choose.
    await this.testDriver.sendKeyAndWait(Key.Enter);
    // Confirm position.
    await this.testDriver.sendKeyAndWait(Key.Enter);

    // Assert inserted inside first block p5_setup not at top-level.
    chai.assert.equal('controls_if', await this.testDriver.getFocusedBlockType());
    await this.testDriver.keyUp();
    chai.assert.equal(
      'p5_background_color',
      await this.testDriver.getFocusedBlockType(),
    );
  });
});
