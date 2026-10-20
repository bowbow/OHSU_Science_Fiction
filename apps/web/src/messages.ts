import type { CoreFailure } from "@bookclub/core";

export function failureSentence(failure: CoreFailure): string {
  switch (failure.code) {
    case "username_taken":
      return "That username is already taken.";
    case "username_invalid":
      return `The username is not valid. ${usernameReason(failure.reason)}`;
    case "invalid_credentials":
      return "Username or password is incorrect.";
    case "already_signed_in":
      return "You are already signed in.";
    case "not_signed_in":
      return "Sign in to see the book club.";
    case "not_an_admin":
      return "Only an admin can make that change.";
    case "not_a_regular_member":
      return "Only regular members can suggest a book.";
    case "suggestions_closed":
      return "Book suggestions are not open.";
    case "title_empty":
      return "Enter a book title.";
    case "already_suggested":
      return "That book is already on the list.";
    case "not_your_suggestion":
      return "You can only remove a book you suggested.";
    case "suggestion_not_found":
      return "That book is no longer on the list.";
    case "book_already_selected":
      return "A book has already been selected.";
    case "book_not_selected":
      return "A book has not been selected yet.";
    case "book_search_failed":
      return "The book search did not respond. Try again.";
    case "match_not_offered":
      return "Choose one of the books that matched that title.";
    case "vote_tie":
      return "These books have the same number of votes. Choose the book the club will read.";
    case "not_in_the_tie":
      return "Choose one of the books with the most votes.";
    case "meeting_time_invalid":
      return "Enter a date and time.";
    case "meeting_time_taken":
      return "That meeting time is already on the list.";
    case "meeting_time_not_found":
      return "That meeting time is no longer on the list.";
    case "meeting_tie":
      return "These times have the same number of votes. Choose the time the club will meet.";
    case "not_in_the_meeting_tie":
      return "Choose one of the times with the most votes.";
    case "no_meeting_times":
      return "Propose a meeting time before selecting a date.";
    case "meeting_already_selected":
      return "A meeting time has already been selected.";
    case "feedback_empty":
      return "Enter some feedback before submitting.";
    case "feedback_too_long":
      return "Feedback must be 1,000 words or fewer.";
    case "feedback_not_found":
      return "That feedback item is no longer available.";
    case "feedback_none_selected":
      return "Select at least one feedback item to delete.";
  }
}

function usernameReason(reason: "empty" | "too_short" | "too_long" | "bad_characters" | "must_start_alphanumeric"): string {
  switch (reason) {
    case "empty":
      return "Enter a username.";
    case "too_short":
      return "Use at least 3 characters.";
    case "too_long":
      return "Use at most 30 characters.";
    case "bad_characters":
      return "Use only letters, numbers, hyphens, and underscores.";
    case "must_start_alphanumeric":
      return "Start with a letter or number.";
  }
}

