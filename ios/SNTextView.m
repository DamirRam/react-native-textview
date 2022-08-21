/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <SNTextView.h>

#import <React/RCTBridge.h>

#import "RCTUITextField.h"

@implementation SNTextView
{
  RCTUITextField *_backedTextInputView;
	NSString *userDefinedKeyboardLanguage;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `blurOnSubmit` defaults to `true` for <TextInput multiline={false}> by design.
    self.blurOnSubmit = YES;
		self->userDefinedKeyboardLanguage = @"ru";

    _backedTextInputView = [[RCTUITextField alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.textInputDelegate = self;

    [self addSubview:_backedTextInputView];
  }

  return self;
}

- (id<RCTBackedTextInputDelegate>)backedTextInputView
{
  return _backedTextInputView;
}

+ (NSString *)langFromLocale:(NSString *)locale {
    NSRange r = [locale rangeOfString:@"_"];
    if (r.length == 0) r.location = locale.length;
    NSRange r2 = [locale rangeOfString:@"-"];
    if (r2.length == 0) r2.location = locale.length;
    return [[locale substringToIndex:MIN(r.location, r2.location)] lowercaseString];
}

- (UITextInputMode *) textInputMode {
    for (UITextInputMode *tim in [UITextInputMode activeInputModes]) {
        if ([[SNTextView langFromLocale:userDefinedKeyboardLanguage] isEqualToString:[SNTextView langFromLocale:tim.primaryLanguage]]) return tim;
    }
    return [super textInputMode];
}

- (void) setLanguage: (NSString *)language {
		self->userDefinedKeyboardLanguage = language;
}

@end
