/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {testFileLocations, testSetup} from './test_setup.js';

suite('Menus test', function () {
  // Setting timeout to unlimited as these tests take longer time to run
  this.timeout(0);

  // Clear the workspace and load start blocks
  setup(async function () {
    this.testDriver = await testSetup(testFileLocations.BASE);
  });

  test('Menu action opens menu', async function () {
    // Navigate to draw_circle_1.
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('draw_circle_1');
    await this.testDriver.sendKeyAndWait([Key.Ctrl, Key.Return]);
    chai.assert.isTrue(
      await this.testDriver.contextMenuExists('Collapse Block'),
      'The menu should be openable on a block',
    );
  });

  test('Menu action returns true in the toolbox', async function () {
    // Navigate to draw_circle_1.
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('draw_circle_1');
    // Navigate to a toolbox category
    await this.testDriver.moveToToolboxCategory('Functions');
    // Move to flyout.
    await this.testDriver.keyRight();
    await this.testDriver.sendKeyAndWait([Key.Ctrl, Key.Return]);

    chai.assert.isTrue(
      await this.testDriver.contextMenuExists('Help'),
      'The menu should be openable on a block in the toolbox',
    );
  });

  test('Menu action returns false during drag', async function () {
    // Navigate to draw_circle_1.
    await this.testDriver.tabNavigateToWorkspace();
    await this.testDriver.focusOnBlock('draw_circle_1');
    // Start moving the block
    await this.testDriver.sendKeyAndWait('m');
    await this.testDriver.sendKeyAndWait([Key.Ctrl, Key.Return]);
    chai.assert.isTrue(
      await this.testDriver.contextMenuExists('Collapse Block', true),
      'The menu should not be openable during a move',
    );
  });
});
