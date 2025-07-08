/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import * as Blockly from 'blockly';
import {testFileLocations, testSetup} from './test_setup.js';
import {Key} from 'webdriverio';

const isKeyboardNavigating = function (browser: WebdriverIO.Browser) {
  return browser.execute(() => {
    return document.body.classList.contains('blocklyKeyboardNavigation');
  });
};

suite(
  'Keyboard navigation mode set on mouse or keyboard interaction',
  function () {
    // Setting timeout to unlimited as these tests take a longer time to run than most mocha tests
    this.timeout(0);

    setup(async function () {
      // Reload the page between tests
      this.testDriver = await testSetup(testFileLocations.NAVIGATION_TEST_BLOCKS);

      // Reset the keyboard navigation state between tests.
      await this.testDriver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(false);
      });

      // Start with the workspace focused.
      await this.testDriver.tabNavigateToWorkspace();
    });

    test('T to open toolbox enables keyboard mode', async function () {
      await this.testDriver.sendKeyAndWait('t');

      chai.assert.isTrue(await isKeyboardNavigating(this.testDriver.browser));
    });

    test('M for move mode enables keyboard mode', async function () {
      await this.testDriver.focusOnBlock('controls_if_2');
      await this.testDriver.sendKeyAndWait('m');

      chai.assert.isTrue(await isKeyboardNavigating(this.testDriver.browser));
    });

    test('W for workspace cursor enables keyboard mode', async function () {
      await this.testDriver.sendKeyAndWait('w');

      chai.assert.isTrue(await isKeyboardNavigating(this.testDriver.browser));
    });

    test('X to disconnect enables keyboard mode', async function () {
      await this.testDriver.focusOnBlock('controls_if_2');
      await this.testDriver.sendKeyAndWait('x');

      chai.assert.isTrue(await isKeyboardNavigating(this.testDriver.browser));
    });

    test('Copy does not change keyboard mode state', async function () {
      // Make sure we're on a copyable block so that copy occurs
      await this.testDriver.focusOnBlock('controls_if_2');
      await this.testDriver.sendKeyAndWait('c');

      chai.assert.isFalse(await isKeyboardNavigating(this.testDriver.browser));

      this.testDriver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(true);
      });

      await this.testDriver.sendKeyAndWait('c');

      chai.assert.isTrue(await isKeyboardNavigating(this.testDriver.browser));
    });

    test('Delete does not change keyboard mode state', async function () {
      // Make sure we're on a deletable block so that delete occurs
      await this.testDriver.focusOnBlock('controls_if_2');
      await this.testDriver.sendKeyAndWait(Key.Backspace);

      chai.assert.isFalse(await isKeyboardNavigating(this.testDriver.browser));

      this.testDriver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(true);
      });

      // Focus a different deletable block
      await this.testDriver.focusOnBlock('controls_if_1');
      await this.testDriver.sendKeyAndWait(Key.Backspace);

      chai.assert.isTrue(await isKeyboardNavigating(this.testDriver.browser));
    });

    test('Right clicking a block disables keyboard mode', async function () {
      await this.testDriver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(true);
      });

      await this.testDriver.pause();
      // Right click a block
      this.testDriver.clickBlock('controls_if_1', {button: 'right'});
      await this.testDriver.pause();

      chai.assert.isFalse(await isKeyboardNavigating(this.testDriver.browser));
    });

    test('Dragging a block with mouse disables keyboard mode', async function () {
      await this.testDriver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(true);
      });

      await this.testDriver.pause();
      // Drag a block
      const element =
        await this.testDriver.getBlockElementById('controls_if_1');

      await this.testDriver.browser.execute(() => {
        const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
        const block = ws.getBlockById('controls_if_1') as Blockly.BlockSvg;
        ws.scrollBoundsIntoView(
          block.getBoundingRectangleWithoutChildren(),
          10,
        );
      });
      await element.dragAndDrop({x: 10, y: 10});
      await this.testDriver.pause();

      chai.assert.isFalse(await isKeyboardNavigating(this.testDriver.browser));
    });
  },
);
