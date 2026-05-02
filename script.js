function sendEmailsUponFormSubmit(e){
  // Get Form Values
    var formValues = e.namedValues
    var html = '<table>';
    for (Key in formValues) {
    var key = Key;
    var data = formValues[Key];
    html += '<tr><td>' + key + "</td><td> " + data + '</td>';
      };
    html += '</table>';
    var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl()
    html += "<p> Sheet: " + sheetUrl + "</p>"
    var newDate = Utilities.formatDate(new Date(), "GMT-5", "MM/dd/yyyy-HH:mm:ss")
    var emailSubject = "Form Submitted: "+ newDate
    var sheetOwner = SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail()

    Logger.log(html)
    // Send Emails
      MailApp.sendEmail({
        to:  sheetOwner,
        subject: emailSubject,
        htmlBody: html
      })
}