/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Key names for common characters. These should be used with keyup/keydown
 * events, since the .keyCode property on those is meant to indicate the
 * _physical key_ the user held down on the keyboard. Hence the mapping uses
 * only the unshifted version of each key (e.g. no '#', since that's shift+3).
 * Keypress events on the other hand generate (mostly) ASCII codes since they
 * correspond to *characters* the user typed.
 *
 * For further reference: http://unixpapa.com/js/key.html
 *
 * This list is not localized and therefore some of the key codes are not
 * correct for non-US keyboard layouts.
 *
 * Copied from goog.events.keynames
 */
const keyNames: Record<string, string> = {
  /* eslint-disable @typescript-eslint/naming-convention */
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  19: 'pause',
  20: 'caps-lock',
  27: 'esc',
  32: 'space',
  33: 'pg-up',
  34: 'pg-down',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  45: 'insert',
  46: 'delete',
  48: '0',
  49: '1',
  50: '2',
  51: '3',
  52: '4',
  53: '5',
  54: '6',
  55: '7',
  56: '8',
  57: '9',
  59: 'semicolon',
  61: 'equals',
  65: 'a',
  66: 'b',
  67: 'c',
  68: 'd',
  69: 'e',
  70: 'f',
  71: 'g',
  72: 'h',
  73: 'i',
  74: 'j',
  75: 'k',
  76: 'l',
  77: 'm',
  78: 'n',
  79: 'o',
  80: 'p',
  81: 'q',
  82: 'r',
  83: 's',
  84: 't',
  85: 'u',
  86: 'v',
  87: 'w',
  88: 'x',
  89: 'y',
  90: 'z',
  93: 'context',
  96: 'num-0',
  97: 'num-1',
  98: 'num-2',
  99: 'num-3',
  100: 'num-4',
  101: 'num-5',
  102: 'num-6',
  103: 'num-7',
  104: 'num-8',
  105: 'num-9',
  106: 'num-multiply',
  107: 'num-plus',
  109: 'num-minus',
  110: 'num-period',
  111: 'num-division',
  112: 'f1',
  113: 'f2',
  114: 'f3',
  115: 'f4',
  116: 'f5',
  117: 'f6',
  118: 'f7',
  119: 'f8',
  120: 'f9',
  121: 'f10',
  122: 'f11',
  123: 'f12',
  186: 'semicolon',
  187: 'equals',
  189: 'dash',
  188: ',',
  190: '.',
  191: '/',
  192: '`',
  219: 'open-square-bracket',
  220: '\\',
  221: 'close-square-bracket',
  222: 'single-quote',
  224: 'win',
  /* eslint-enable @typescript-eslint/naming-convention */
};

const modifierKeys = ['control', 'alt', 'meta'];

/**
 * Assign the appropriate class names for the key.
 * Modifier keys are indicated so they can be switched to a platform specific
 * key.
 *
 * @param keyName The key name.
 */
function getKeyClassName(keyName: string) {
  return modifierKeys.includes(keyName.toLowerCase()) ? 'key modifier' : 'key';
}

/**
 * Naive title case conversion. Uppercases first and lowercases remainder.
 *
 * @param str String.
 * @returns The string in title case.
 */
export function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
}

/**
 * Convert from a serialized key code to a HTML string.
 * This should be the inverse of ShortcutRegistry.createSerializedKey, but
 * should also convert ascii characters to strings.
 *
 * @param keycode The key code as a string of characters separated
 *     by the + character.
 * @param index Which key code this is in sequence.
 * @returns A single string representing the key code.
 */
function keyCodeToString(keycode: string, index: number) {
  let result = `<span class="shortcut-combo shortcut-combo-${index}">`;
  const pieces = keycode.split('+');

  let piece = pieces[0];
  let strrep = keyNames[piece] ?? piece;

  for (let i = 0; i < pieces.length; i++) {
    piece = pieces[i];
    strrep = keyNames[piece] ?? piece;
    const className = getKeyClassName(strrep);
    if (i > 0) {
      result += '+';
    }
    result += `<span class="${className}">${toTitleCase(strrep)}</span>`;
  }
  result += '</span>';
  return result;
}

/**
 * Convert an array of key codes into a comma-separated list of strings.
 *
 * @param keycodeArr The array of key codes to convert.
 * @returns The input array as a comma-separated list of
 *     human-readable strings wrapped in HTML.
 */
export function keyCodeArrayToString(keycodeArr: string[]): string {
  const stringified = keycodeArr.map((keycode, index) =>
    keyCodeToString(keycode, index),
  );
  return stringified.join('<span class="separator">/</span>');
}
