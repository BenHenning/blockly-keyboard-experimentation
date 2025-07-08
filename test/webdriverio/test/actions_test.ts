/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {TestPlayground, testSetup} from './test_setup.js';

suite('Menus test', function () {
  // Setting timeout to unlimited as these tests take longer time to run
  this.timeout(0);

  // Clear the workspace and load start blocks
  setup(async function () {
    this.driver = await testSetup(TestPlayground.BASE);
  });

  test('Menu action opens menu', async function () {
    // Navigate to draw_circle_1.
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('draw_circle_1');
    await this.driver.sendKeyAndWait([Key.Ctrl, Key.Return]);
    chai.assert.isTrue(
      await this.driver.contextMenuExists('Collapse Block'),
      'The menu should be openable on a block',
    );
  });

  test('Menu action returns true in the toolbox', async function () {
    // Navigate to draw_circle_1.
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('draw_circle_1');
    // Navigate to a toolbox category
    await this.driver.moveToToolboxCategory('Functions');
    // Move to flyout.
    await this.driver.keyRight();
    await this.driver.sendKeyAndWait([Key.Ctrl, Key.Return]);

    chai.assert.isTrue(
      await this.driver.contextMenuExists('Help'),
      'The menu should be openable on a block in the toolbox',
    );
  });

  test('Menu action returns false during drag', async function () {
    // Navigate to draw_circle_1.
    await this.driver.tabNavigateToWorkspace();
    await this.driver.focusOnBlock('draw_circle_1');
    // Start moving the block
    await this.driver.sendKeyAndWait('m');
    await this.driver.sendKeyAndWait([Key.Ctrl, Key.Return]);
    chai.assert.isTrue(
      await this.driver.contextMenuExists('Collapse Block', true),
      'The menu should not be openable during a move',
    );
  });
});
