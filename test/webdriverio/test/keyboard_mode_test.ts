/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import * as Blockly from 'blockly';
import {TestPlayground, testSetup} from './test_setup.js';
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
      this.driver = await testSetup(TestPlayground.NAVIGATION_TEST_BLOCKS);

      // Reset the keyboard navigation state between tests.
      await this.driver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(false);
      });

      // Start with the workspace focused.
      await this.driver.tabNavigateToWorkspace();
    });

    test('T to open toolbox enables keyboard mode', async function () {
      await this.driver.sendKeyAndWait('t');

      chai.assert.isTrue(await isKeyboardNavigating(this.driver.browser));
    });

    test('M for move mode enables keyboard mode', async function () {
      await this.driver.focusOnBlock('controls_if_2');
      await this.driver.sendKeyAndWait('m');

      chai.assert.isTrue(await isKeyboardNavigating(this.driver.browser));
    });

    test('W for workspace cursor enables keyboard mode', async function () {
      await this.driver.sendKeyAndWait('w');

      chai.assert.isTrue(await isKeyboardNavigating(this.driver.browser));
    });

    test('X to disconnect enables keyboard mode', async function () {
      await this.driver.focusOnBlock('controls_if_2');
      await this.driver.sendKeyAndWait('x');

      chai.assert.isTrue(await isKeyboardNavigating(this.driver.browser));
    });

    test('Copy does not change keyboard mode state', async function () {
      // Make sure we're on a copyable block so that copy occurs
      await this.driver.focusOnBlock('controls_if_2');
      await this.driver.sendKeyAndWait('c');

      chai.assert.isFalse(await isKeyboardNavigating(this.driver.browser));

      this.driver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(true);
      });

      await this.driver.sendKeyAndWait('c');

      chai.assert.isTrue(await isKeyboardNavigating(this.driver.browser));
    });

    test('Delete does not change keyboard mode state', async function () {
      // Make sure we're on a deletable block so that delete occurs
      await this.driver.focusOnBlock('controls_if_2');
      await this.driver.sendKeyAndWait(Key.Backspace);

      chai.assert.isFalse(await isKeyboardNavigating(this.driver.browser));

      this.driver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(true);
      });

      // Focus a different deletable block
      await this.driver.focusOnBlock('controls_if_1');
      await this.driver.sendKeyAndWait(Key.Backspace);

      chai.assert.isTrue(await isKeyboardNavigating(this.driver.browser));
    });

    test('Right clicking a block disables keyboard mode', async function () {
      await this.driver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(true);
      });

      await this.driver.pause();
      // Right click a block
      this.driver.clickBlock('controls_if_1', {button: 'right'});
      await this.driver.pause();

      chai.assert.isFalse(await isKeyboardNavigating(this.driver.browser));
    });

    test('Dragging a block with mouse disables keyboard mode', async function () {
      await this.driver.browser.execute(() => {
        Blockly.keyboardNavigationController.setIsActive(true);
      });

      await this.driver.pause();
      // Drag a block
      const element = await this.driver.getBlockElementById('controls_if_1');

      await this.driver.browser.execute(() => {
        const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg;
        const block = ws.getBlockById('controls_if_1') as Blockly.BlockSvg;
        ws.scrollBoundsIntoView(
          block.getBoundingRectangleWithoutChildren(),
          10,
        );
      });
      await element.dragAndDrop({x: 10, y: 10});
      await this.driver.pause();

      chai.assert.isFalse(await isKeyboardNavigating(this.driver.browser));
    });
  },
);
