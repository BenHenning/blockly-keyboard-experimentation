/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import * as Blockly from 'blockly';
import {TestPlayground, testSetup} from './test_setup.js';
import {Key} from 'webdriverio';

suite('Workspace comment navigation', function () {
  // Setting timeout to unlimited as these tests take a longer time to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  setup(async function () {
    this.driver = await testSetup(TestPlayground.NAVIGATION_TEST_BLOCKS);
    [this.commentId1, this.commentId2] = await this.driver.browser.execute(
      () => {
        const workspace = Blockly.getMainWorkspace();
        const comment1 = Blockly.serialization.workspaceComments.append(
          {
            text: 'Comment one',
            x: 200,
            y: 200,
          },
          workspace,
        );

        const comment2 = Blockly.serialization.workspaceComments.append(
          {
            text: 'Comment two',
            x: 300,
            y: 300,
          },
          workspace,
        );

        return [comment1.id, comment2.id];
      },
    );

    this.getCommentLocation = async (commentId: string) => {
      return this.driver.browser.execute((commentId: string) => {
        const comment = Blockly.getMainWorkspace().getCommentById(commentId);
        if (!comment) return null;
        const bounds = (
          comment as Blockly.comments.RenderedWorkspaceComment
        ).getBoundingRectangle();

        return [bounds.left, bounds.top];
      }, commentId);
    };
  });

  test('Navigate forward from block to workspace comment', async function () {
    await this.driver.focusOnBlock('p5_canvas_1');
    await this.driver.keyDown();
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, this.commentId1);
  });

  test('Navigate forward from workspace comment to block', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId2);
    await this.driver.keyDown();
    const focusedBlock = await this.driver.getFocusedBlockType();
    chai.assert.equal(focusedBlock, 'p5_draw');
  });

  test('Navigate backward from block to workspace comment', async function () {
    await this.driver.focusOnBlock('p5_draw_1');
    await this.driver.keyUp();
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, this.commentId2);
  });

  test('Navigate backward from workspace comment to block', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.keyUp();
    const focusedBlock = await this.driver.getFocusedBlockType();
    chai.assert.equal(focusedBlock, 'p5_canvas');
  });

  test('Navigate forward from workspace comment to workspace comment', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.keyDown();
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, this.commentId2);
  });

  test('Navigate backward from workspace comment to workspace comment', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId2);
    await this.driver.keyUp();
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, this.commentId1);
  });

  test('Navigate forward from workspace comment to workspace comment button', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.keyRight();
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, `${this.commentId1}_collapse_bar_button`);
  });

  test('Navigate backward from workspace comment button to workspace comment', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.keyRight();
    await this.driver.keyLeft();
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, this.commentId1);
  });

  test('Navigate forward from workspace comment button to workspace comment button', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.keyRight();
    await this.driver.keyRight();
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, `${this.commentId1}_delete_bar_button`);
  });

  test('Navigate backward from workspace comment button to workspace comment button', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.keyRight();
    await this.driver.keyRight();
    await this.driver.keyLeft();
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, `${this.commentId1}_collapse_bar_button`);
  });

  test('Activate workspace comment button', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.keyRight();
    await this.driver.sendKeyAndWait(Key.Enter);
    const collapsed = await this.driver.browser.execute((commentId) => {
      return Blockly.getMainWorkspace()
        .getCommentById(commentId)
        ?.isCollapsed();
    }, this.commentId1);
    chai.assert.isTrue(collapsed);
  });

  test('Activating workspace comment focuses its editor', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.sendKeyAndWait(Key.Enter);
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, `${this.commentId1}_comment_textarea_`);
  });

  test('Terminating editing commits edits and focuses root workspace comment', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.sendKeyAndWait(Key.Enter);
    await this.driver.sendKeyAndWait('Hello world');
    await this.driver.sendKeyAndWait(Key.Escape);
    const focusedNodeId = await this.driver.getCurrentFocusNodeId();
    chai.assert.equal(focusedNodeId, `${this.commentId1}`);

    const commentText = await this.driver.browser.execute((commentId) => {
      return Blockly.getMainWorkspace().getCommentById(commentId)?.getText();
    }, this.commentId1);
    chai.assert.equal(commentText, 'Comment oneHello world');
  });

  test('Action menu can be displayed for a workspace comment', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);
    await this.driver.sendKeyAndWait([Key.Ctrl, Key.Return]);
    chai.assert.isTrue(
      await this.driver.contextMenuExists('Duplicate Comment'),
      'The menu should be openable on a workspace comment',
    );
    chai.assert.isTrue(
      await this.driver.contextMenuExists('Remove Comment'),
      'The menu should be openable on a workspace comment',
    );
    chai.assert.isTrue(
      await this.driver.contextMenuExists('Move CommentM'),
      'The menu should be openable on a workspace comment',
    );
  });

  test('Workspace comments can be moved in unconstrained mode', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);

    const initialPosition = await this.getCommentLocation(this.commentId1);
    chai.assert.deepEqual(initialPosition, [200, 200]);

    await this.driver.sendKeyAndWait('m');
    await this.driver.sendKeyAndWait([Key.Alt, Key.ArrowDown], 2);
    await this.driver.sendKeyAndWait([Key.Alt, Key.ArrowRight]);
    await this.driver.sendKeyAndWait(Key.Enter);

    const newPosition = await this.getCommentLocation(this.commentId1);
    chai.assert.deepEqual(newPosition, [220, 240]);
  });

  test('Workspace comments can be moved in constrained mode', async function () {
    await this.driver.focusOnWorkspaceComment(this.commentId1);

    const initialPosition = await this.getCommentLocation(this.commentId1);
    chai.assert.deepEqual(initialPosition, [200, 200]);

    await this.driver.sendKeyAndWait('m');
    await this.driver.keyUp(2);
    await this.driver.keyLeft();
    await this.driver.sendKeyAndWait(Key.Enter);

    const newPosition = await this.getCommentLocation(this.commentId1);
    chai.assert.deepEqual(newPosition, [180, 160]);
  });
});
