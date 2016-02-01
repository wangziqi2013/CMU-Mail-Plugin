# CMU-Mail-Plugin
This javascript plugin enhances functionalities and optimizes user experience for CMU mailbox. It requires a client side browser extension that is compatible with TemperMonkey or GreaseMonkey or any equivalence, in order to host and execute the script properly. However, it should not be difficult to migrate this to other front-end platforms or even integrate this into the webmail application.

Some of the functionality enhancement are overlapped with what have already been provided by the webmail itself. This is due to the fact that this project started as a practice project in my free time, and I just added some features with not *any* investigation into the webmail system. Such features include row highlighting and filtering (this plugin provides a lightweight and thus more flexible for filtering, though, the concept itself is not very attractive to somebody who already configured a filter list on their familiar client).

Features
========
Since they keep chaning rapidly, and I may not want to update this readme file everytime I do a commit, so this would largely be dependent on your reading the source code.

The only hint I can provide is that, this plugin uses a data-driven approach where all run-time configurations are listed as global data structures at the beginning of the JS file, so you could find many clues from these lists and dictionaries.

Big Thoughts (MailSQL)
======================
I plan to implement a client-side query system called MailSQL that utilizes SQL to express queries and use Javascript to execute them. MailSQL should be a highly specialized variant of SQL that only supports a very limited set of syntax and semantics, and it could be used as an analytic tool to conduct statictical information on somebody;s mailbox.

MailSQL should only be implemented on the client side, in order to relief overheads off the server. It should have a memory based, non-transactional, query engine that performs basic SQL operation.

MailSQL inputs data from the webpage of mail service by sending GET requests and parsing resulting HTML (this is easy with browser's built-in DOM parser). It always does a full-scan first, with some limits on the depth of scan, though, to avoid being noticed by the mail server administrator and being caught into trouble, and then perform all computation in-memory.

I could not give an estimate about the effort needed to implement this, but as far as I know, sending GET/POST requests are easy even just with JS (XMLHttpRequest); parsing SQL might be easy with existing libraries (but we need to customize standard SQL); execution engine is difficult at least for me. If you are interested on this project or you have better ideas, feel free to contant me ziqiw@andrew.University-Name.edu
