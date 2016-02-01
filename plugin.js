// ==UserScript==
// @name        CMU_Mail_Filter
// @namespace   675973885@qq.com
// @match     https://webmail.andrew.cmu.edu/src/*
// @version     1
// @grant       none
// ==/UserScript==

var plugin_data_dict = {
  unwanted_exact_list: [
    "piazza.com",
    "lieyongz",
    "sebastian",
  ],
  
  title_color_dict: {
    "10-601A": "#abcdef",
    "15-721": "#ffff00",
    "15-440": "#DD8866",
  }, 
}
 
  
var param_action_dict = {
  "author": [plugin_clear_right_page, plugin_show_author, ],
  "settings": [plugin_clear_right_page, plugin_show_settings, ], 
}

var box_action_dict = {
  "INBOX": [remove_unwanted, 
            add_sendto_link, 
            customize_row_color, 
            change_time_representation,
            add_reply_and_forward_icon, ],// save_data_to_draft], 
  "Sent": [remove_unwanted, 
           add_sendto_link, 
           change_time_representation, ],
  "Drafts": [show_plugin_page, ]
}
  
var column_action_dict = {
  "left_main": [add_item_to_left_column, 
                add_read_all_to_left_column],
  "right_main": [parse_cookie,  // Restore settings from cookie
                 determine_box, // Call callbacks for each mailbox
                ], 
}

/*
 * Defines items on the left column
 */
var left_column_item_list = [
  {"icon": "../themes/cmu_theme/iconOptions.png",
   "text": "Plugin Settings",
   "param": "settings"},
  {
   "icon": "../themes/cmu_theme/infoTime.png",
   "text": "About Author",
   "param": "author"},
]

/*
 * cookie object
 *
 * We must be careful since cookie only allows <= 4K data
 */
var plugin_settings_dict = {
  "filter_on": false,
};

/*
 * add_item_to_left_column() - Add new items to left column
 * as functionality enhancement
 */
function add_item_to_left_column()
{
  var left_item_container = document.getElementById("boxFolders").children[0];
  if(left_item_container == undefined) return;
  
  var first_item = left_item_container.children[1];
  if(first_item == undefined) return;
  
  for(var i = 0;i < left_column_item_list.length;i++)
  {
    var item = left_column_item_list[i];
    var link_text;

    new_item = first_item.cloneNode(true);
    left_item_container.appendChild(new_item);
    // We use sent box image
    new_item.children[0].setAttribute("src", item["icon"]);
    new_item.children[1].innerHTML = item["text"];

    link_text = new_item.children[1].getAttribute("href") + "&plugin=" + item["param"];
    new_item.children[1].setAttribute("href", link_text);
  }
  //// Next one
  /*
  new_item = first_item.cloneNode(true);
  left_item_container.appendChild(new_item);
  // We use sent box image
  new_item.children[0].setAttribute("src", "../themes/cmu_theme/infoTime.png");
  new_item.children[1].innerHTML = "About Author";
  
  link_text = new_item.children[1].getAttribute("href") + "&plugin=author";
  new_item.children[1].setAttribute("href", link_text);
  */
  return;
}

/*
 * read_all_email() - Mark all emails from the first one to the most recent ones as read
 */
function read_all_email(e)
{
  var do_it = window.confirm("This operation will potentially generate huge amount of traffic to the server\n" + 
                             "Do you want to continue?");
  if(do_it == false) return;
  
  //alert(window.parent.document.getElementsByName("mailbox"));
  var right_document = window.frameElement.parentNode.children[1].contentDocument;
  var mailbox_input = right_document.getElementsByName("mailbox")[0];
  //alert(mailbox_input.length);
  if(mailbox_input == undefined) return;
    
  if(mailbox_input.getAttribute("value") != "INBOX")
  {
    alert("Please switch to inbox first");
    return;
  }

  var post_str = "";//"location=%2Fsrc%2Fright_main.php%3Fmailbox%3DINBOX%26startMessage%3D1"
  var smtoken = right_document.getElementsByName("smtoken")[0].getAttribute("value");
  post_str += ("&smtoken=" + smtoken);
  post_str += "&mailbox=INBOX&markRead=Read";
  //alert(1);
  var latest_row = right_document.getElementsByClassName("fieldSubject")[0].getElementsByTagName(
    "a")[0].getAttribute("href");
  
  var index1 = latest_row.indexOf("passed_id=");
  var index2 = latest_row.indexOf("&", index1);
  var latest_id = parseInt(latest_row.substring(index1 + 10, index2));
  var count = latest_id;
  for(var i = 0;i <= latest_id;i++)
  {
    var s = "&msg%5B" + i.toString() + "%5D=" + count.toString();
    count -= 1;
    post_str += s;
  }
  
  var request = new XMLHttpRequest();
  var url = "/src/move_messages.php";
  request.open("POST", url, true);

  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  request.setRequestHeader("Content-length", post_str.length);
  request.setRequestHeader("Connection", "close");

  request.onreadystatechange = function() 
  {
	  if(request.readyState == 4) 
    {
      // Refresh left and right window
      window.location.reload();
      right_document.defaultView.location.reload();
		  //alert("All message has been read");
      return;
	  }
  }
  
  request.send(post_str);
  
  return;
}

/*
 * add_read_all_to_left_column() - Add a "read all" button to left frame
 */
function add_read_all_to_left_column()
{
  var left_column = document.getElementById("boxFolders");
  var inbox_row = left_column.getElementsByClassName("inbox")[0];
  if(inbox_row == undefined) return;
  
  var read_all_link = document.createElement("a");
  read_all_link.style.background = "transparent url(\"../themes/cmu_theme/msgSeen.png\") no-repeat scroll left top";
  read_all_link.style.display = "block";
  read_all_link.style.float = "right";
  read_all_link.style.paddingBottom = "16px";
  //read_all_link.style.marginRight = "16px";
  read_all_link.style.position = "relative";
  read_all_link.style.top = "2px";
  read_all_link.style.width = "20px";
  read_all_link.setAttribute("href", "javascript:void(0)");
  read_all_link.addEventListener("click", read_all_email);
  read_all_link.setAttribute("title", "Read All and Refresh");
  
  inbox_row.insertBefore(read_all_link, inbox_row.children[1]);
  
  return;
}

/*
 * report_removed_num() - Output to the page on how many items has been hidden
 */
function report_removed_num(num)
{
  var bottom_bar = document.getElementsByClassName("paginatorInner");
  if(bottom_bar.length != 1)
  {
    alert("Illegal mailbox layout!\nCannot report removed number!");
    return;
  }
  
  bottom_bar = bottom_bar[0].children[0].children[0].children[1];
  var txt = bottom_bar.innerHTML;
  
  end_index = txt.indexOf("total");
  if(end_index == -1)
  {
    alert("Illegal summary layout!");
    return;
  }

  end_index += "total".length;
  txt_new = txt.substring(0, end_index) + ", " + num.toString() + " hidden)";
  bottom_bar.innerHTML = txt_new;
  
  return;
}
  
function remove_unwanted()
{
  if(plugin_settings_dict["filter_on"] == false) return;
  
  var i;
  
  var from_list = document.getElementsByClassName("fieldFrom");
  
  var removed_num = 0;
  var unwanted_exact_list = plugin_data_dict["unwanted_exact_list"];
  for(i = 0;i < from_list.length;i++)
  {
    from_email = from_list[i].getAttribute("title");
    
    var j;
    for(j = 0;j < unwanted_exact_list.length;j++)
    {
      var index = from_email.indexOf(unwanted_exact_list[j]);
      
      if(index != -1)
      {
        var parent_node = from_list[i].parentNode;
        
        parent_node.style.display = "none";
        // Accounting 
        removed_num += 1;
        // Only match for once
        break;
      }
    }
  }
  
  report_removed_num(removed_num);
}

/*
 * add_reply_and_forward_icon() - Adds a forward and reply icon for each row
 */
function add_reply_and_forward_icon()
{
  var row_list = document.getElementsByClassName("fieldFlags");
  //alert(row_list.length);
  if(row_list.length == 0) return;
  
  for(var i = 0;i < row_list.length;i++)
  {
    var row_div = row_list[i].children[0];
    if(row_div == undefined) return;
    
    var row_id = row_div.parentNode.parentNode.children[0].children[0].getAttribute("value");
    //alert(row_id);
    
    // We insert before these two
    var first_img = row_div.children[0];
    
    var reply_img = document.createElement("img");
    reply_img.setAttribute("src", "../themes/cmu_theme/messagePaginateBack.png");
    reply_img.setAttribute("title", "Reply All");
    
    var reply_link = document.createElement("a");
    reply_link.setAttribute("href", "https://webmail.andrew.cmu.edu/src/compose.php?passed_id=" +
                            row_id +
                            "&mailbox=INBOX&smaction=reply_all");
    reply_link.appendChild(reply_img);
    
    var fwd_img = document.createElement("img");
    fwd_img.setAttribute("src", "../themes/cmu_theme/messagePaginateForward.png");
    fwd_img.setAttribute("title", "Forward");
    
    var fwd_link = document.createElement("a");
    fwd_link.setAttribute("href", "https://webmail.andrew.cmu.edu/src/compose.php?passed_id=" +
                            row_id +
                            "&mailbox=INBOX&smaction=forward");
    fwd_link.appendChild(fwd_img);
    
    row_div.insertBefore(reply_link, first_img);
    row_div.insertBefore(fwd_link, first_img);
  }
  
  return;
}

/*
 * change_time_representation() - Changes from absolute time to relative
 * time representation
 */
function change_time_representation()
{
  var date_list = document.getElementsByClassName("fieldDate");
  if(date_list.length == 0) return;
  
  var left_document = window.frameElement.parentNode.children[0].contentDocument;
  
  var current_date = left_document.getElementById("boxInfo").children[1].children[0].innerHTML;
  current_date = current_date.split("&nbsp;");
  current_date[0] = current_date[0].substring(0, current_date[0].length - 1);
  //alert(JSON.stringify(current_date));
  
  var date_dict = {
    "Sun": 7,
    "Sat": 6,
    "Fri": 5,
    "Thu": 4,
    "Wed": 3,
    "Tue": 2,
    "Mon": 1,
  }
  
  for(var i = 0;i < date_list.length;i++)
  {
    var date_field = date_list[i];
    if(date_field.children.length > 0) date_field = date_field.children[0];
    
    var date_text = date_field.innerHTML;
    
    date_text = date_text.split(" ");
    
    //alert(date_text[0], date_text[0].indexOf(":"));
    // If there is no week, then just use the currenr week
    // and we have not removed the ":" yet
    if(date_text[0].indexOf(":") != -1)
    {
      date_text = [current_date[0] + ":", date_text[0], date_text[1]];
      //alert(current_date[0]);
    }
    //return;
    // If it is week-time-am/pm notation then we do conversion
    if(date_text[0].substring(0, date_text[0].length - 1) in date_dict)
    {
      var day1 = date_text[0].substring(0, date_text[0].length - 1);
      var t1 = date_text[1].split(":");
      var ampm1 = date_text[2];
      
      var day2 = current_date[0];
      var t2 = current_date[1].split(":");
      var ampm2 = current_date[2];
      
      var day_num1 = date_dict[day1];
      var day_num2 = date_dict[day2];
      
      if(day_num2 < day_num1) day_num2 += 7;
      
      var day_diff = day_num2 - day_num1;
      
      var hour1 = parseInt(t1[0]);
      var hour2 = parseInt(t2[0]);
      
      if(ampm1 == "pm" && hour1 != 12) hour1 += 12;
      //else if(hour1 == 12) hour1 = 0;
      
      if(ampm2 == "pm" && hour2 != 12) hour2 += 12;
      //else if(hour2 == 12) hour2 = 0;
      
      var hour_diff = hour2 - hour1;
      
      var min1 = parseInt(t1[1]);
      var min2 = parseInt(t2[1]);
      var min_diff = min2 - min1;
      
      var total_min_diff = min_diff + hour_diff * 60 + day_diff * 1440;
      if(total_min_diff < 0) total_min_diff += (60 * 12);
      
      //alert(total_min_diff);
      var diff_str;
      
      if(total_min_diff == 0)
      {
        diff_str = "Just Now";
      }
      else if(total_min_diff < 60)
      {
        if(total_min_diff > 1) diff_str = total_min_diff.toString() + " minutes ago";
        else diff_str = total_min_diff.toString() + " minute ago";
      }
      else if(total_min_diff < 1440)
      {
        var total_hour_diff = Math.floor(total_min_diff / 60);
        total_min_diff %= 60;
        
        var hour_str, min_str;
        if(total_hour_diff > 1) hour_str = " hrs ";
        else hour_str = " hr ";
        
        if(total_min_diff > 1) min_str = " mins ";
        else min_str = " min ";
        
        diff_str = total_hour_diff.toString() + hour_str + total_min_diff.toString() + min_str;
      }
      else
      {
        var total_day_diff = Math.floor(total_min_diff / 1440);
        total_min_diff %= 1440;
        
        var total_hour_diff = Math.floor(total_min_diff / 60);
        total_min_diff %= 60;
        
        var day_str, hour_str, min_str;
        if(total_day_diff > 1) day_str = " days ";
        else day_str = " day ";
        
        if(total_hour_diff > 1) hour_str = " hrs ";
        else hour_str = " hr ";
        
        if(total_min_diff > 1) min_str = " mins ";
        else min_str = " min ";
        
        diff_str = (total_day_diff.toString() + day_str + 
                   total_hour_diff.toString() + hour_str);
                
      }
      
      date_field.innerHTML = diff_str;
    }
    
  }
}

/*
 * customize_row_color() - Change the color of a row according to
 * customized settings
 */
function customize_row_color()
{
  var row_list = document.getElementsByClassName("messageRow");
  
  if(row_list.length == 0) return;
  
  for(var i = 0;i < row_list.length;i++)
  {
    var search_text;
    var row = row_list[i];
    var label = row.getElementsByTagName("label");
    
    if(label.length == 0) return;
    
    var text_node = label[0].getElementsByTagName("a");
    if(text_node.length > 0)
    {
      search_text = text_node[0].innerHTML;
    }
    else
    {
      text_node = label[0].getElementsByTagName("span");
      if(text_node.length > 0)
      {
        search_text = text_node[0].innerHTML;
      }
      else
      {
        search_text = label[0].innerHTML;
      }
    }
    
    var color_dict = plugin_data_dict["title_color_dict"];
    for(var title in color_dict)
    {
      if(search_text.indexOf(title) == -1) continue;
      //alert(title);
      var color = color_dict[title];
      for(var k = 0;k < row.children.length;k++)
      {
        row.children[k].setAttribute("bgcolor", color);
      }
    }
  }
  
  return;
}

/*
 * add_sendto_link() - Add a sendto link to email addresses appearing 
 * on the email list for fast reply
 */
function add_sendto_link()
{
  var from_field_list = document.getElementsByClassName("fieldFrom");
  if(from_field_list.length == 0) return;
  
  var i;
  for(i = 0;i < from_field_list.length;i++)
  {
    var child_label = from_field_list[i].children[0];
    if(child_label == undefined) continue;
    
    // If there is another <span> inside, we just jump one level
    // further into the hierarchy
    if(child_label.children[0] != undefined) child_label = child_label.children[0];
    
    // Frist create a new link element
    var new_link = document.createElement("a");
    var new_text = document.createTextNode(child_label.innerHTML);
    new_link.appendChild(new_text);

    // Then set a link
    var link_text = "/src/compose.php?send_to=";
    var email_text = from_field_list[i].getAttribute("title");
    
    email_text = email_text.replace("@", "%40");
    new_link.setAttribute("href", link_text + email_text);
    
    var txt_child = child_label.childNodes[0];
    txt_child.parentNode.removeChild(txt_child);
    //child_label.innerHTMl = "";
    child_label.appendChild(new_link);
  }
  
  return;
}
/*
 * parse_get_parameter() - Returns a mapping from key to value
 */
function parse_get_parameter(url_txt)
{
  var begin_index = url_txt.indexOf("?");
  if(begin_index == -1) return {};
  
  param = url_txt.substring(begin_index + 1, url_txt.length);
  param_list = param.split("&");
  
  var param_dict = {};
  var i;
  for(i = 0;i < param_list.length;i++)
  {
    key_value_pair = param_list[i].split("=");
    if(key_value_pair.length != 2)
    {
      alert("Invalid request URL!");
      return {};
    }
    
    var key = key_value_pair[0];
    var value = key_value_pair[1];
    
    param_dict[key] = value;
  }
  
  return param_dict;
}

/*
 * get_page_box_text() - Return the text on the page indicating current box
 */
function get_page_box_text()
{
  var folder_list = document.getElementById("currentFolderList");
  if(folder_list != undefined)
  {
    var page_box_text = folder_list.children[1];
    if(page_box_text != undefined)
    {
      return page_box_text.innerHTML;
    }
  }
  
  return "";
}

/*
 * determine_box() - Determine the current mail box, if it is
 * in the allowed list then all functions related to this mailbox
 * is executed
 */
function determine_box()
{ 
  var is_right_box = false;
  var page_box_text = get_page_box_text();
  //alert(page_box_text);
  //alert(window.location.href);
  
  if(page_box_text in box_action_dict)
  {
    box_action_list = box_action_dict[page_box_text];
    var i;
    for(i = 0;i < box_action_list.length;i++)
    {
      box_action_list[i]();
    }
  }
  
  return;
}

/*
 * dispatch_column() - Call functions for different columns
 */
function dispatch_column()
{
  var link_text = window.location.href;
  
  var suffix_index = link_text.indexOf(".php");
  var prefix_index = link_text.lastIndexOf("/");
  
  var column_id = link_text.substring(prefix_index + 1, suffix_index);
  if(column_id in column_action_dict)
  {
    var column_action_list = column_action_dict[column_id];
    var i;
    for(i = 0;i < column_action_list.length;i++)
    {
      column_action_list[i]();
    }
  }
}

/*
 * parse_cookie() - Retrieve cookie from browser, and parse it to become
 * a dict object
 */
function parse_cookie()
{
  var cookie_text = document.cookie;
  var cookie_list = cookie_text.split(";");
  
  var i;
  var cookie_dict_local = {};
  for(i = 0;i < cookie_list.length;i++)
  {
    var key_value_pair = cookie_list[i].split("=");
    if(key_value_pair.length != 2) continue;
    
    var key = key_value_pair[0].trim();
    var value = key_value_pair[1].trim();
    
    if(key == "plugin_settings") 
    {
      value = value.split("'").join("\"");
      plugin_settings_dict = JSON.parse(value);
    }
  }
  
  return cookie_dict_local;
}

/*
 * assemble_cookie() - Save what is currently in cookie_dict into browser cookie
 */
function assemble_cookie()
{
  var cookie_str = document.cookie;
  var start_index = cookie_str.indexOf("plugin_settings");
  if(start_index != -1)
  {
    var end_index = cookie_str.indexOf(";", start_index);
    if(end_index == -1) cookie_str = cookie_str.substring(0, start_index);
    else cookie_str = (cookie_str.substring(0, start_index) +
                       cookie_str.substring(end_index + 1, cookie_str.length));
  }
  
  if(cookie_str[cookie_str.length - 1] != ";") cookie_str += ";";
  
  var value = JSON.stringify(plugin_settings_dict).split("\"").join("'");
    
  cookie_str = ("plugin_settings" + "=" + value);
  
  // Finally set the cookie
  document.cookie = cookie_str;

  return;
}

/*
 * show_plugin_page() - When we are directed to drafts folder, we check
 * for special arguments, and if they are there, clear the page and draw
 * our own
 */
function show_plugin_page()
{
  var param_dict = parse_get_parameter(window.location.href);
  
  // If "plugin" does not appear as a parameter just return - it's
  // the real draft box
  if(!("plugin" in param_dict)) return;
  plugin_action = param_dict["plugin"];
  
  if(!(plugin_action in param_action_dict)) return;
  param_action_list = param_action_dict[plugin_action];
  var i;
  for(i = 0;i < param_action_list.length;i++)
  {
    param_action_list[i]();
  }
  
  return;
}

/*
 * plugin_clear_right_page() - Remove all elements in right column for plugin page
 */
function plugin_clear_right_page()
{
  var right_body = document.getElementById("messageListWrap");
  right_body.parentNode.removeChild(right_body);
  
  var tools_list = document.getElementById("plugins");
  tools_list.parentNode.removeChild(tools_list);
  
  return;
}

/*
 * create_node_with_text() - Create a DOM element with plain text inside
 */
function create_node_with_text(node_type, text)
{
  var new_node = document.createElement(node_type);
  var new_node_text = document.createTextNode(text);
  new_node.appendChild(new_node_text);
  
  return new_node;
}

function plugin_show_author()
{
  var page = document.getElementsByClassName("pageContents")[0];
  
  page.appendChild(create_node_with_text("h1", "About Author"));
  page.appendChild(create_node_with_text("div", "This mail plugin is created by Ziqi Wang " + 
                                        "(ziqiw@andrew.cmu.edu)"));
  page.appendChild(create_node_with_text("div", "If you have any problem welcome to contact me"));
  
  return;
}

/*
 * save_all_settings() - Save all changes made in cookie
 */
function save_all_settings(e)
{
  plugin_settings_dict["filter_on"] = false;

  if(document.getElementById("filter_on_yes").checked)
  {
    plugin_settings_dict["filter_on"] = true;
  }
  
  // This will pack the object into a JSON and then set cookie
  assemble_cookie();
  alert("All changed saved!");
  
  return;
}

/*
 * download_page_and_parse() - Send a HTTP request and then call the callback
 */
function download_page(method, url, callback)
{
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() 
  {
    if(request.readyState == 4 && request.status == 200)
    {
      callback(request.responseText);
    }
    
    return;
  };
  
  request.open(method, url, true);
  request.send();
  
  return;
}

/*
 * save_data_to_draft() - Save current global data to a draft email
 */
function save_data_to_draft()
{
  download_page("GET", 
                "/src/compose.php?mailbox=INBOX.Drafts&startMessage=1", 
                function(page_text)
                {
                  // Create a new HTML node, set visibility to hidden, and 
                  // insert it into the page. We need to insert in order for
                  // form component to work
                  var new_dom = document.createElement("html");
                  new_dom.style.visibility = 'hidden';
                  
                  // Let browser parse the raw HTML string 
                  new_dom.innerHTML = page_text;
                  document.getElementsByTagName("body")[0].appendChild(new_dom);

                  // Get the submission button by its tag name and name
                  // since getElementsByName does not work
                  var save_draft_button = new_dom.getElementsByTagName("input");
                  var i, found_flag = false;
                  for(i = 0;i < save_draft_button.length;i++)
                  {
                    if(save_draft_button[i].getAttribute("name") == "draft")
                    {
                      found_flag = true;
                      save_draft_button = save_draft_button[i];
                      break;
                    }
                  }
                  
                  // Then get the form object
                  if(found_flag == false) return;
                  var form = save_draft_button.form;
                  
                  // Set a hidden input object to carry information that
                  // we are requesting a draft storage
                  var new_input = document.createElement("input");
                  new_input.setAttribute("type", "hidden");
                  new_input.setAttribute("name", "draft");
                  new_input.setAttribute("value", "Save Draft");
                  form.appendChild(new_input);
                  
                  // Put all data into a single object and then serialized
                  form.elements["body"].value = JSON.stringify(plugin_data_dict);
                  
                  // Redirect response into this invisible iframe to prevent
                  // users from noticing the hidden operation
                  var new_iframe = document.createElement("iframe");
                  new_iframe.setAttribute("name", "plugin_private_iframe");
                  new_iframe.style.visibility = 'hidden';
                  new_dom.appendChild(new_iframe);
                  
                  form.target = "plugin_private_iframe";
                  
                  form.submit();
                  
                  // Destory two temporary object we have just created
                  new_dom.parentNode.removeChild(new_dom);
                  new_iframe.parentNode.removeChild(new_iframe);
                });
  
  return;
}

function plugin_show_sender_filter_list(page)
{
  page.appendChild(create_node_with_text("h2", "Sender Filter List"));
  var unwanted_exact_list = plugin_data_dict["unwanted_exact_list"];
  for(var i = 0;i < unwanted_exact_list.length;i++)
  {
    //alert(i);
    var line_div = document.createElement("div");
    var line_input = document.createElement("input");
    line_input.setAttribute("type", "text");
    line_input.setAttribute("id", "unwanted_exact_list_" + i.toString());
    line_input.setAttribute("value", unwanted_exact_list[i]);
    line_div.appendChild(line_input);
    
    var line_button_save = create_node_with_text("button", "Save");
    line_button_save.setAttribute("name", "unwanted_exact_list_" + i.toString());
    var line_button_remove = create_node_with_text("button", "Remove");
    line_button_remove.setAttribute("name", "unwanted_exact_list_" + i.toString());
    
    line_div.appendChild(line_button_save);
    line_div.appendChild(line_button_remove);
    page.appendChild(line_div);
  }
  
  return;
}

function plugin_show_enable_filter(page)
{
  page.appendChild(create_node_with_text("h2", "Enable Filter"));
  
  var filter_div = document.createElement("div");
  var filter_radio_yes = document.createElement("input");
  filter_radio_yes.setAttribute("type", "radio");
  filter_radio_yes.setAttribute("name", "filter_on");
  filter_radio_yes.setAttribute("value", "Yes");
  filter_radio_yes.setAttribute("id", "filter_on_yes");

  var filter_radio_no = document.createElement("input");
  filter_radio_no.setAttribute("type", "radio");
  filter_radio_no.setAttribute("name", "filter_on");
  filter_radio_no.setAttribute("value", "No");
  filter_radio_no.setAttribute("id", "filter_on_no");
  
  if("filter_on" in plugin_settings_dict)
  {
    var filter_on_flag = plugin_settings_dict["filter_on"];
    
    if(filter_on_flag == true) filter_radio_yes.checked = true;
    else if(filter_on_flag == false) filter_radio_no.checked = true;
  }
  
  filter_div.appendChild(filter_radio_yes);
  filter_div.appendChild(document.createTextNode("Yes"));
  filter_div.appendChild(filter_radio_no);
  filter_div.appendChild(document.createTextNode("No"));
  
  page.appendChild(filter_div);
  
  return;
}

function plugin_show_sender_coloring(page)
{
  page.appendChild(create_node_with_text("h2", "Message Coloring"));
  var title_color_dict = plugin_data_dict["title_color_dict"];
  for(var i in title_color_dict)
  {
    var line_div = document.createElement("div");

    var line_input1 = document.createElement("input");
    line_input1.setAttribute("type", "text");
    line_input1.setAttribute("id", "title_color_dict_key_" + i.toString());
    line_input1.setAttribute("value", i);
    line_div.appendChild(line_input1);
    
    var line_input2 = document.createElement("input");
    line_input2.setAttribute("type", "text");
    line_input2.setAttribute("id", "title_color_dict_value_" + i.toString());
    line_input2.setAttribute("value", title_color_dict[i]);
    line_div.appendChild(line_input2);
    
    var line_button_save = create_node_with_text("button", "Save");
    line_button_save.setAttribute("name", "title_color_dict_save_" + i.toString());
    var line_button_remove = create_node_with_text("button", "Remove");
    line_button_remove.setAttribute("name", "title_color_dict_remove_" + i.toString());
    
    line_div.appendChild(line_button_save);
    line_div.appendChild(line_button_remove);
    
    page.appendChild(line_div);
  }

  return;
}

function plugin_show_submit_button(page)
{
  var submit_div = document.createElement("div");
  var submit_button = document.createElement("button");
  var submit_button_text = document.createTextNode("Save All");
  submit_button.appendChild(submit_button_text);
  submit_button.addEventListener("click", save_all_settings);
  submit_div.appendChild(submit_button);
  
  page.appendChild(submit_div);
  
  return;
}

/*
 * plugin_show_settings() - Draw setting page
 */
function plugin_show_settings()
{
  var page = document.getElementsByClassName("pageContents")[0];
  page.style.overflow = "scroll";
  
  plugin_show_enable_filter(page);
  plugin_show_sender_filter_list(page);
  plugin_show_sender_coloring(page);
  plugin_show_submit_button(page);
  
  return;
}

dispatch_column();


/*
Exception: SyntaxError: missing : after property id
@Scratchpad/9:16
*/
/*
Exception: SyntaxError: missing ] after element list
@Scratchpad/9:17
*/