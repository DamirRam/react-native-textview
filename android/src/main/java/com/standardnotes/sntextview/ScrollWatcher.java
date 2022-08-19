/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.standardnotes.sntextview;

public interface ScrollWatcher {
  public void onScrollChanged(int horiz, int vert, int oldHoriz, int oldVert);
}
