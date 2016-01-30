// ==UserScript==
// @name        CMU_Mail_Filter
// @namespace   675973885@qq.com
// @match     https://webmail.andrew.cmu.edu/src/*
// @version     1
// @grant       none
// ==/UserScript==

var unwanted_list_exact = [
  "@piazza.com",
  "lieyongz",
  "sebastian",
]
  
var param_action_dict = {
  "author": [plugin_clear_right_page, plugin_show_author],
}

var box_action_dict = {
  "INBOX": [remove_unwanted, add_sendto_link], 
  "Sent": [remove_unwanted, ],
  "Drafts": [show_plugin_page, ]
}
  
var column_action_dict = {
  "left_main": [add_item_to_left_column, ],
  "right_main": [determine_box, ],
}

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
  
  var link_text;
  
  new_item = first_item.cloneNode(true);
  left_item_container.appendChild(new_item);
  // We use sent box image
  new_item.children[0].setAttribute("src", "../themes/cmu_theme/boxSent.png");
  new_item.children[1].innerHTML = "Plugin Settings";
  
  new_item = first_item.cloneNode(true);
  left_item_container.appendChild(new_item);
  // We use sent box image
  new_item.children[0].setAttribute("src", "../themes/cmu_theme/boxInbox.png");
  new_item.children[1].innerHTML = "About Author";
  
  link_text = new_item.children[1].getAttribute("href") + "&plugin=author";
  new_item.children[1].setAttribute("href", link_text);
  
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
  var i;
  
  from_list = document.getElementsByClassName("fieldFrom");
  list_len = from_list.length;
  
  if(list_len == 0) return;
  
  var removed_num = 0;
  for(i = 0;i < from_list.length;i++)
  {
    from_email = from_list[i].getAttribute("title");
    
    var j;
    for(j = 0;j < unwanted_list_exact.length;j++)
    {
      var index = from_email.indexOf(unwanted_list_exact[j]);
      
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

dispatch_column();

