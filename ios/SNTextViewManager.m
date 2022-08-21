/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <SNTextViewManager.h>

#import <React/RCTBaseTextInputShadowView.h>
#import <SNTextView.h>

@implementation SNTextViewManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  RCTBaseTextInputShadowView *shadowView =
    (RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[SNTextView alloc] initWithBridge:self.bridge];
}

RCT_CUSTOM_VIEW_PROPERTY(language, NSString, SNTextView) {
	if (json != nil) {
    [view setLanguage: json];
	}  
};

@end
