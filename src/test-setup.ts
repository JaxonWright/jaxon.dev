// jsdom has no layout engine, so it omits the scrolling APIs the shell calls.
Element.prototype.scrollTo ??= function () {};
Element.prototype.scrollIntoView ??= function () {};
