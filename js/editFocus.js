var editDiv = function(obj){
	if (typeof obj == 'string') obj = document.getElementById(obj);
	this.obj = obj;
	this.keepCursor = true;
	this.contains = function(a, b, c) {
	    if (!c && a === b)
	        return !1;
	    if (a.compareDocumentPosition) {
	        if (a = a.compareDocumentPosition(b), a == 20 || a == 0)
	            return !0
	            } else if (a.contains(b))
	                return !0;
	    return !1
	}
	this.containsRange = function(a, c) {
	    var d = c.commonAncestorContainer || c.parentElement && c.parentElement() || null;
	    if (d)
	        return this.contains(a, d, !0);
	    else if (c.length)
	        return this.contains(a, c.item(0), !0);
	    return !1
	}
	this.getSelection = function() {
	    return document.selection ? document.selection : window.getSelection()
	};
	this.getRange = function(a) {
	    var c = this.getSelection();
	    if (!c)
	        return null;
	    c = c.getRangeAt ? 
	        c.rangeCount ? c.getRangeAt(0) : null : c.createRange();
	    return !c ? null : a ? this.containsRange(a, c) ? c : null : c
	};
	this.isEmpty = function() {
	    var a = this.obj.innerHTML;
	    return a === "" ? !$.browser.ie : !0 && a.toLowerCase() === "<br>" ? !0 : !1;
	};
	this.saveRange = function(a) {
	    if (a = a ? this.getRange(this.obj) : this.getRange())
	        this._lastRange = a
	};
	this.insertHTML = function(a){
	    if (a !== "") {
	        var c = this.getRange(this.obj);
	        if (c)
	            if (c.pasteHTML)
	                c.pasteHTML(a), c.collapse(!1), c.select();
	        else if (c.length)
	        	this.getSelection().clear(), c = this.getRange(), c.pasteHTML(a), c.collapse(!1), c.select();
	        else {
	            if (c.createContextualFragment) {
	                a += 
	                    '<img style="display:inline;width:1px;height:1px;">';
	                var f = c.createContextualFragment(a), a = f.lastChild;
	                c.deleteContents();
	                c.insertNode(f);
	                c.setEndAfter(a);
	                c.setStartAfter(a);
	                f = this.getSelection();
	                f.removeAllRanges();
	                f.addRange(c);
	                c = this.obj;
	                f = this.getRelativeXY(a, c);
	                c.scrollTop = f[1] < c.scrollHeight ? c.scrollHeight : f[1];
	                //!1 || document.execCommand("Delete", !1, null);
	                //this.contains(c, a) && c.removeChild(a)
	            }
	        }
	        else if (this.isEmpty() ? this.obj.innerHTML = a : this.obj.innerHTML += a, c = this.getRange())
	        a = this.obj.lastChild, 
	            c.selectNode ? (c.setEndAfter(a), c.setStartAfter(a), f = this.getSelection(), f.removeAllRanges(), f.addRange(c)) : c.moveToElementText && (c.moveToElementText(a), c.collapse(!1), c.select());
	        this.keepCursor && this.saveRange();
	    }
	}
	this.p = function(c) {
        return (c ? c.scrollLeft : Math.max(document.documentElement.scrollLeft, document.body.scrollLeft)) || 0
    }
	this.o = function(c) {
        return (c ? c.scrollTop : Math.max(document.documentElement.scrollTop, document.body.scrollTop)) || 0
    }
	this.c = function(c) {
        var a = 0, b = 0;
        if (c)
            if (document.documentElement.getBoundingClientRect && c.getBoundingClientRect) {
                b = {left: 0,top: 0,right: 0,bottom: 0};
                try {
                    b = c.getBoundingClientRect()
                } catch (m) {
                    return [0, 0]
                }
                var c = c.ownerDocument, 
                e = $.browser.ie ? 2 : 0, a = b.top - e + this.o(c), b = b.left - e + this.p(c)
            } else
                for (; c.offsetParent; )
                    a += c.offsetTop, b += c.offsetLeft, c = c.offsetParent;
        return [b, a]
    }
	this.m = function(a) {
        a = this.c(a);
        a[0] += this.p();
        a[1] += this.o();
        return a
    }
	this.getRelativeXY = function(c, a) {
	    var b = this.m(c), d = this.m(a), e = [];
	    e[0] = b[0] - d[0];
	    e[1] = b[1] - d[1];
	    return e
	}
	this.newline = function(){
		this.insertHTML('<br/>');
	}
	this.getContent = function(){
		return this.obj.innerHTML = this.obj.innerHTML.replace(/<img style="display:inline;width:1px;height:1px;">/g, '');
	}
}
