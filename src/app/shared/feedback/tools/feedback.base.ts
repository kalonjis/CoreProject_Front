export class FeedbackBase {
  feedbackMessage: string = '';
  isFeedbackSuccess: boolean = true;
  showFeedback: boolean = false;
  buttonText: string = '';
  buttonAction: () => void = () => {};

  displayFeedback(isSuccess: boolean, message: string, buttonText: string) {
    this.showFeedback = true;
    this.isFeedbackSuccess = isSuccess;
    this.feedbackMessage = message;
    this.buttonText = buttonText;
  }

  displaySuccess(message: string, buttonText: string) {
    this.displayFeedback(true, message, buttonText);
  }

  displayError(message: string, buttonText: string) {
    this.displayFeedback(false, message, buttonText);
  }
}
