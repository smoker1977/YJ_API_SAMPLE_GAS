/*****
 * AccessTokenの取得
 *****/
function getAccessToken(refresh_token) {
    var payload = {
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN
    };
    var params = {
        payload : payload
    };

    var response = UrlFetchApp.fetch(URL_TOKEN, params);
    var response_body = JSON.parse(response.getContentText());

    return response_body['access_token'];
}

/*****
 * レポートのダウンロード
 *****/
function downloadReport(url, access_token, account_id, report_jod_id) {
    var headers = {
        'Authorization': 'Bearer ' + access_token
    };
    var payload = {
        accountId: parseInt(account_id),
        reportJobId: report_jod_id
    };
    var params = {
        method : 'post',
        contentType: 'application/json',
        headers: headers,
        payload: JSON.stringify(payload)
    };

    var response = UrlFetchApp.fetch(url + '/ReportDefinitionService/download', params);
    return response;
}

/*****
 * レポートの登録
 *****/
function resistReport(URL_API, access_token, account, type, range, listFields, repName){
  var headers = {
    'Authorization': 'Bearer ' + access_token
  };
  
  var payload = {
    accountId: parseInt(account),
    operand: [{
      fields: listFields,
      reportDateRangeType: range,
      reportDownloadEncode: "UTF-8",
      reportName: repName,
      reportType: type
    }]
  };
  Logger.log(JSON.stringify(payload));
  
  var params = {
    method : 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(URL_API + '/ReportDefinitionService/add', params);
  return response;
  
}

/*****
 * レポートのステータスを返却する
 *****/
function waitReport(URL_API, access_token, account_id, report_id){
  var headers = {
    'Authorization': 'Bearer ' + access_token
  };
  
  var payload = {
    accountId: parseInt(account_id),
    reportJobIds: [
      parseFloat(report_id)
    ]
  };
  Logger.log(payload);
  
  var params = {
    method : 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(URL_API + '/ReportDefinitionService/get', params);
  return response;
  
}

/*****
 * 指定のレポートで利用できるフィールドを取得する
 *****/
function getFields(URL_API, access_token, type){
  var headers = {
    'Authorization': 'Bearer ' + access_token
  };
  
  var payload = {
    reportType: type
  };
  Logger.log(payload);
  
  var params = {
    method : 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload)
  };
  var response = UrlFetchApp.fetch(URL_API + '/ReportDefinitionService/getReportFields', params);
  return response;
  
}