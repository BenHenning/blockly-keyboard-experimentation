/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {TestPlayground, testSetup} from './test_setup.js';

suite('Insert test', function () {
  // Setting timeout to unlimited as these tests take longer time to run
  this.timeout(0);

  // Clear the workspace and load start blocks
  setup(async function () {
    this.driver = await testSetup(TestPlayground.BASE);
  });

  test('Insert and cancel with block selection', async function () {
    // Navigate to draw_circle_1.
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('draw_circle_1');
    // Insert 'if' block
    await this.driver.sendKeyAndWait('t');
    await this.driver.keyRight();
    await this.driver.sendKeyAndWait(Key.Enter);
    chai.assert.equal('controls_if', await this.driver.getFocusedBlockType());
    const ifId = await this.driver.getCurrentFocusedBlockId();
    chai.assert.ok(ifId);

    // Cancel
    await this.driver.sendKeyAndWait(Key.Escape);

    chai.assert.isFalse(await this.driver.blockIsPresent(ifId));
  });

  test('Insert and cancel with workspace selection', async function () {
    // Navigate to workspace.
    await this.driver.tabNavigateToWorkspace();
    await this.driver.sendKeyAndWait('w');
    // Insert 'if' block
    await this.driver.sendKeyAndWait('t');
    await this.driver.keyRight();
    await this.driver.sendKeyAndWait(Key.Enter);
    chai.assert.equal('controls_if', await this.driver.getFocusedBlockType());
    const ifId = await this.driver.getCurrentFocusedBlockId();
    chai.assert.ok(ifId);

    // Cancel
    await this.driver.sendKeyAndWait(Key.Escape);

    chai.assert.isFalse(await this.driver.blockIsPresent(ifId));
  });

  test('Insert C-shaped block with statement block selected', async function () {
    // Navigate to draw_circle_1.
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('draw_circle_1');

    await this.driver.moveToToolboxCategory('Functions');
    // Move to flyout.
    await this.driver.keyRight();
    // Select Function block.
    await this.driver.sendKeyAndWait(Key.Enter);
    // Confirm move.
    await this.driver.sendKeyAndWait(Key.Enter);

    chai.assert.equal(
      'procedures_defnoreturn',
      await this.driver.getFocusedBlockType(),
    );
  });

  test('Insert without having focused the workspace', async function () {
    await this.driver.tabNavigateToToolbox();

    // Insert 'if' block
    await this.driver.keyRight();
    // Choose.
    await this.driver.sendKeyAndWait(Key.Enter);
    // Confirm position.
    await this.driver.sendKeyAndWait(Key.Enter);

    // Assert inserted inside first block p5_setup not at top-level.
    chai.assert.equal('controls_if', await this.driver.getFocusedBlockType());
    await this.driver.keyUp();
    chai.assert.equal(
      'p5_background_color',
      await this.driver.getFocusedBlockType(),
    );
  });
});
