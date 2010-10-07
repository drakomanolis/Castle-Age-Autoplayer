
////////////////////////////////////////////////////////////////////
//                          gifting OBJECT
// this is the main object for dealing with gifting
/////////////////////////////////////////////////////////////////////

gifting = {
    types: ["gifts", "queue", "history"],

    log: function (type, level, text) {
        try {
            if (typeof type !== 'string' || type === '' || this.types.indexOf(type) < 0)  {
                utility.warn("Type passed to load: ", type);
                throw "Invalid type value!";
            }

            var snapshot = {};
            if (utility.logLevel >= level) {
                $.extend(snapshot, this[type].records);
                utility.log(level, text, type, snapshot);
            }

            return true;
        } catch (err) {
            utility.error("ERROR in gifting.log: " + err);
            return false;
        }
    },

    load: function (type) {
        try {
            if (typeof type !== 'string' || type === '' || this.types.indexOf(type) < 0)  {
                utility.warn("Type passed to load: ", type);
                throw "Invalid type value!";
            }

            this[type].records = gm.getItem("gifting." + type, 'default');
            if (this[type].records === 'default') {
                this[type].records = [];
                gm.setItem("gifting." + type, this[type].records);
            }

            this.log(type, 1, "gifting.load " + type);
            state.setItem("Gift" + type.ucFirst() + "DashUpdate", true);
            return true;
        } catch (err) {
            utility.error("ERROR in gifting.load: " + err);
            return false;
        }
    },

    save: function (type) {
        try {
            if (typeof type !== 'string' || type === '' || this.types.indexOf(type) < 0)  {
                utility.warn("Type passed to load: ", type);
                throw "Invalid type value!";
            }

            gm.setItem("gifting." + type, this[type].records);
            this.log(type, 1, "gifting.save " + type);
            state.setItem("Gift" + type.ucFirst() + "DashUpdate", true);
            return true;
        } catch (err) {
            utility.error("ERROR in gifting.save: " + err);
            return false;
        }
    },

    clear: function (type) {
        try {
            if (typeof type !== 'string' || type === '' || this.types.indexOf(type) < 0)  {
                utility.warn("Type passed to clear: ", type);
                throw "Invalid type value!";
            }

            this[type].records = gm.setItem("gifting." + type, []);
            state.setItem("Gift" + type.ucFirst() + "DashUpdate", true);
            return true;
        } catch (err) {
            utility.error("ERROR in gifting.clear: " + err);
            return false;
        }
    },

    init: function () {
        try {
            var result = true;

            if (!gifting.load("gifts")) {
                result = false;
            }

            if (!gifting.load("queue")) {
                result = false;
            }

            if (!gifting.load("history")) {
                result = false;
            }

            this.queue.fix();
            return result;
        } catch (err) {
            utility.error("ERROR in gifting.init: " + err);
            return undefined;
        }
    },

    accept: function () {
        try {
            var giftDiv   = null,
                tempText  = '',
                tempNum   = 0,
                current   = {};

            giftDiv = $("div[class='messages']:first img:first");
            if (giftDiv && giftDiv.length) {
                tempNum = parseInt(giftDiv.attr("uid"), 10);
                if (tempNum > 0) {
                    current = new this.queue.record().data;
                    current.userId = tempNum;
                    tempText = $.trim(giftDiv.attr("title"));
                    if (tempText) {
                        current.name = tempText;
                    } else {
                        utility.warn("No name found in", giftDiv);
                        current.name = "Unknown";
                    }
                } else {
                    utility.warn("No uid found in", giftDiv);
                }
            } else {
                utility.warn("No gift messages found!");
            }

            return !utility.isEmpty(gm.setItem("GiftEntry", current));
        } catch (err) {
            utility.error("ERROR in gifting.accept: " + err);
            return undefined;
        }
    },

    getCurrent: function () {
        try {
            return gm.getItem("GiftEntry", {});
        } catch (err) {
            utility.error("ERROR in gifting.getCurrent: " + err);
            return undefined;
        }
    },

    setCurrent: function (record) {
        try {
            if (!record || utility.typeOf(record) !== 'object') {
                throw "Not passed a record";
            }

            if (!utility.isNum(record.userId) || record.userId < 1) {
                utility.warn("userId", record.userId);
                throw "Invalid identifying userId!";
            }

            return gm.setItem("GiftEntry", record);
        } catch (err) {
            utility.error("ERROR in gifting.setCurrent: " + err);
            return undefined;
        }
    },

    clearCurrent: function () {
        try {
            return gm.setItem("GiftEntry", {});
        } catch (err) {
            utility.error("ERROR in gifting.clearCurrent: " + err);
            return undefined;
        }
    },

    collecting: function () {
        try {
            if (!utility.isEmpty(this.getCurrent()) && this.getCurrent().checked) {
                this.collected(true);
            }

            if (utility.isEmpty(this.getCurrent()) && state.getItem('HaveGift', false)) {
                if (utility.NavigateTo('army', 'invite_on.gif')) {
                    return true;
                }

                if (!this.accept()) {
                    state.setItem('HaveGift', false);
                    return false;
                }

                schedule.setItem('ClickedFacebookURL', 30);
                state.setItem('clickUrl', "http://apps.facebook.com/reqs.php#confirm_46755028429_0");
                utility.VisitUrl("http://apps.facebook.com/reqs.php#confirm_46755028429_0");
                return true;
            }

            return null;
        } catch (err) {
            utility.error("ERROR in gifting.collecting: " + err);
            return false;
        }
    },

    collect: function () {
        try {
            var giftEntry = false,
                appDiv    = null,
                inputDiv  = null,
                userArr   = [],
                userId    = 0,
                giftDiv   = null,
                giftText  = '',
                giftArr   = [],
                giftType  = '';

            if (window.location.href.indexOf('apps.facebook.com/reqs.php') < 0) {
                return false;
            }

            giftEntry = this.getCurrent();
            if (utility.isEmpty(giftEntry)) {
                return false;
            }

            if (!giftEntry.checked) {
                utility.log(1, 'On FB page with gift ready to go');
                appDiv = $("div[id*='app_46755028429']");
                if (appDiv && appDiv.length) {
                    appDiv.each(function () {
                        inputDiv = $(this).find("input[name*='/castle/tracker.php']");
                        if (inputDiv && inputDiv.length) {
                            userArr = inputDiv.attr("name").match(/uid%3D(\d+)/i);
                            if (!userArr || userArr.length !== 2) {
                                return true;
                            }

                            userId = utility.NumberOnly(userArr[1]);
                            if (giftEntry.userId !== userId) {
                                return true;
                            }

                            giftDiv = $(this).find("div[class='pts requestBody']");
                            giftText = '';
                            giftArr = [];
                            giftType = '';
                            if (giftDiv && giftDiv.length) {
                                giftText = $.trim(giftDiv.text());
                                giftArr = giftDiv.text().match(new RegExp("(.*) has sent you a (.*) in Castle Age!.*"));
                                if (giftArr && giftArr.length === 3) {
                                    giftType = giftArr[2];
                                }
                            } else {
                                utility.warn("No requestBody in ", $(this));
                            }

                            if (giftType === '' || gifting.gifts.list().indexOf(giftType) < 0) {
                                utility.log(1, 'Unknown gift type', giftType, gifting.gifts.list());
                                giftType = 'Unknown Gift';
                            }

                            giftEntry.gift = giftType;
                            giftEntry.found = true;
                            giftEntry.checked = true;
                            gifting.setCurrent(giftEntry);
                            schedule.setItem('ClickedFacebookURL', 30);
                            utility.Click(inputDiv.get(0));
                            return false;
                        } else {
                            utility.warn("No input found in ", $(this));
                        }

                        return true;
                    });
                } else {
                    utility.warn("No gifts found for CA");
                }

                giftEntry.checked = true;
                this.setCurrent(giftEntry);
            }

            if (!schedule.check('ClickedFacebookURL')) {
                return false;
            }

            if (giftEntry.found) {
                utility.log(1, 'Gift click timed out');
            } else {
                giftEntry.gift = 'Unknown Gift';
                this.setCurrent(giftEntry);
                utility.log(1, 'Unable to find gift', giftEntry);
            }

            state.setItem('clickUrl', "http://apps.facebook.com/castle_age/army.php?act=acpt&uid=" + giftEntry.userId);
            utility.VisitUrl("http://apps.facebook.com/castle_age/army.php?act=acpt&uid=" + giftEntry.userId);
            return true;
        } catch (err) {
            utility.error("ERROR in gifting.collect: " + err);
            return false;
        }
    },

    collected: function (force) {
        try {
            var giftEntry = this.getCurrent();
            if (!utility.isEmpty(giftEntry)) {
                if (force || utility.CheckForImage("gift_yes.gif")) {
                    this.queue.setItem(giftEntry);
                    this.history.received(giftEntry);
                }

                this.clearCurrent();
            }

            schedule.setItem("NoGiftDelay", 0);
            return true;
        } catch (err) {
            utility.error("ERROR in gifting.collected: " + err);
            return false;
        }
    },

    popCheck: function (type) {
        try {
            var popDiv     = null,
                tempDiv    = null,
                tempText   = '',
                tryAgain   = true;

            popDiv = $("#pop_content");
            if (popDiv && popDiv.length) {
                tempDiv = popDiv.find("input[name='sendit']");
                if (tempDiv && tempDiv.length) {
                    utility.log(1, 'Sending gifts to Facebook');
                    utility.Click(tempDiv.get(0));
                    return true;
                }

                tempDiv = popDiv.find("input[name='skip_ci_btn']");
                if (tempDiv && tempDiv.length) {
                    utility.log(1, 'Denying Email Nag For Gift Send');
                    utility.Click(tempDiv.get(0));
                    return true;
                }

                tempDiv = popDiv.find("input[name='ok']");
                if (tempDiv && tempDiv.length) {
                    tempText = tempDiv.parent().parent().prev().text();
                    if (tempText) {
                        if (/you have run out of requests/.test(tempText)) {
                            utility.log(1, 'Out of requests: ', tempText);
                            schedule.setItem("MaxGiftsExceeded", 10800, 300);
                            tryAgain = false;
                        } else {
                            utility.warn('Popup message: ', tempText);
                        }
                    } else {
                        utility.warn('Popup message but no text found', tempDiv);
                    }

                    utility.Click(tempDiv.get(0));
                    return tryAgain;
                }

                tempText = popDiv.text();
                if (tempText) {
                    if (/Loading/.test(tempText)) {
                        utility.log(1, "Popup is loading ...");
                        return true;
                    } else {
                        utility.warn('Unknown popup!', popDiv.text());
                        return false;
                    }
                } else {
                    utility.warn('Popup message but no text found', popDiv);
                    return false;
                }
            }

            if (this.waitingForDomLoad) {
                return true;
            }

            return null;
        } catch (err) {
            utility.error("ERROR in gifting.popCheck: " + err);
            return undefined;
        }
    },

    gifts: {
        options: ['Same Gift As Received', 'Random Gift'],

        records: [],

        record: function () {
            this.data = {
                name  : '',
                image : ''
            };
        },

        getItem: function (name) {
            try {
                var it    = 0,
                    gift  = false;

                if (typeof name !== 'string' || name === '') {
                    utility.warn("name", name);
                    throw "Invalid identifying name!";
                }

                for (it = 0; it < this.records.length; it += 1) {
                    if (this.records[it].name === name) {
                        break;
                    }
                }

                if (it < this.records.length) {
                    gift = this.records[it];
                }

                return gift;
            } catch (err) {
                utility.error("ERROR in gifting.gifts.getItem: " + err);
                return undefined;
            }
        },

        getImg: function (name) {
            try {
                var it    = 0,
                    image = '';

                if (typeof name !== 'string' || name === '') {
                    utility.warn("name", name);
                    throw "Invalid identifying name!";
                }


                if (name !== 'Unknown Gift') {
                    for (it = 0; it < this.records.length; it += 1) {
                        if (this.records[it].name === name) {
                            image = this.records[it].image;
                            break;
                        }
                    }

                    if (it >= this.records.length) {
                        utility.warn("Gift not in list! ", name);
                    }
                }

                return image;
            } catch (err) {
                utility.error("ERROR in gifting.gifts.getImg: " + err);
                return undefined;
            }
        },

        populate: function () {
            try {
                var giftDiv  = null,
                    newGift  = {},
                    tempDiv  = null,
                    tempText = '',
                    tempArr  = [],
                    update   = false;

                giftDiv = $("#app46755028429_giftContainer div[id*='app46755028429_gift']");
                if (giftDiv && giftDiv.length) {
                    gifting.clear("gifts");
                    giftDiv.each(function () {
                        newGift = new gifting.gifts.record().data;
                        tempDiv = $(this).children(":first");
                        if (tempDiv && tempDiv.length) {
                            tempText = $.trim(tempDiv.text()).replace("!", "");
                            if (tempText) {
                                newGift.name = tempText;
                            } else {
                                utility.warn("Unable to get gift name! No text in ", tempDiv);
                                return true;
                            }
                        } else {
                            utility.warn("Unable to get gift name! No child!");
                            return true;
                        }

                        tempDiv = $(this).find("img[class*='imgButton']");
                        if (tempDiv && tempDiv.length) {
                            tempText = utility.getHTMLPredicate(tempDiv.attr("src"));
                            if (tempText) {
                                newGift.image = tempText;
                            } else {
                                utility.warn("Unable to get gift image! No src in ", tempDiv);
                                return true;
                            }
                        } else {
                            utility.warn("Unable to get gift image! No img!");
                            return true;
                        }

                        if (gifting.gifts.getItem(newGift.name)) {
                            newGift.name += " #2";
                            utility.log(1, "Gift exists, no auto return for ", newGift.name);
                        }

                        gifting.gifts.records.push(newGift);
                        update = true;
                        return true;
                    });
                }

                if (update) {
                    tempArr = this.list();
                    tempText = config.getItem("GiftChoice", this.options[0]);
                    if (tempArr.indexOf(tempText) < 0)  {
                        utility.log(1, "Gift choice invalid, changing from/to ", tempText, this.options[0]);
                        tempText = config.setItem("GiftChoice", this.options[0]);
                    }

                    caap.ChangeDropDownList("GiftChoice", tempArr, tempText);
                    gifting.save("gifts");
                }

                return update;
            } catch (err) {
                utility.error("ERROR in gifting.gifts.populate: " + err);
                return undefined;
            }
        },

        list: function () {
            try {
                var it       = 0,
                    giftList = [];

                for (it = 0; it < this.records.length; it += 1) {
                    giftList.push(this.records[it].name);
                }

                return $.merge($.merge([], this.options), giftList);
            } catch (err) {
                utility.error("ERROR in gifting.gifts.list: " + err);
                return undefined;
            }
        },

        length: function () {
            try {
                return this.records.length;
            } catch (err) {
                utility.error("ERROR in gifting.gifts.length: " + err);
                return undefined;
            }
        },

        random: function () {
            try {
                return this.records[Math.floor(Math.random() * (this.records.length))].name;
            } catch (err) {
                utility.error("ERROR in gifting.gifts.random: " + err);
                return undefined;
            }
        }
    },

    queue: {
        records: [],

        record: function () {
            this.data = {
                userId  : 0,
                name    : '',
                gift    : '',
                checked : false,
                found   : false,
                chosen  : false,
                sent    : false,
                last    : new Date(2009, 0, 1).getTime()
            };
        },

        fix: function () {
            try {
                var it = 0,
                    save = false;

                for (it = this.records.length - 1; it >= 0; it -= 1) {
                    if (!utility.isNum(this.records[it].userId) || this.records[it].userId < 1 || this.records[it].sent === true) {
                        utility.warn("gifting.queue.fix - delete", this.records[it]);
                        this.records.splice(it, 1);
                        save = true;
                    }
                }

                if (save) {
                    gifting.save("queue");
                }

                return this.save;
            } catch (err) {
                utility.error("ERROR in gifting.queue.fix: " + err);
                return undefined;
            }
        },

        setItem: function (record) {
            try {
                if (!record || utility.typeOf(record) !== 'object') {
                    throw "Not passed a record";
                }

                if (!utility.isNum(record.userId) || record.userId < 1) {
                    utility.warn("userId", record.userId);
                    throw "Invalid identifying userId!";
                }

                var it      = 0,
                    found   = false,
                    updated = false;

                if (config.getItem("UniqueGiftQueue", true)) {
                    for (it = 0; it < this.records.length; it += 1) {
                        if (this.records[it].userId === record.userId) {
                            if (this.records[it].name !== record.name) {
                                this.records[it].name = record.name;
                                updated = true;
                                utility.log(1, "Updated users name", record, this.records);
                            }

                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    this.records.push(record);
                    updated = true;
                    utility.log(1, "Added gift to queue", record, this.records);
                }

                if (updated) {
                    gifting.save("queue");
                }

                return true;
            } catch (err) {
                utility.error("ERROR in gifting.queue.setItem: " + err, record);
                return false;
            }
        },

        deleteIndex: function (index) {
            try {
                if (!utility.isNum(index) || index < 0 || index >= this.records.length) {
                    throw "Invalid index! (" + index + ")";
                }

                this.records.splice(index, 1);
                gifting.save("queue");
                return true;
            } catch (err) {
                utility.error("ERROR in gifting.queue.deleteIndex: " + err, index);
                return false;
            }
        },

        length: function () {
            try {
                return this.records.length;
            } catch (err) {
                utility.error("ERROR in gifting.queue.length: " + err);
                return undefined;
            }
        },

        randomImg: '',

        chooseGift: function () {
            try {
                var it = 0,
                    gift = '',
                    choice = '';

                choice = config.getItem("GiftChoice", gifting.gifts.options[0]);
                for (it = 0; it < this.records.length; it += 1) {
                    if (!schedule.since(this.records[it].last || 0, 43200)) {
                        continue;
                    }

                    if (this.records[it].sent) {
                        continue;
                    }

                    switch (choice) {
                    case gifting.gifts.options[0]:
                        gift = this.records[it].gift;
                        break;
                    case gifting.gifts.options[1]:
                        if (this.randomImg) {
                            gift = this.randomImg;
                        } else {
                            gift = gifting.gifts.random();
                            this.randomImg = gift;
                        }

                        break;
                    default:
                        gift = choice;
                    }

                    break;
                }

                if (!gift) {
                    schedule.setItem("NoGiftDelay", 1800, 300);
                }

                return gift;
            } catch (err) {
                utility.error("ERROR in gifting.queue.chooseGift: " + err);
                return undefined;
            }
        },

        chooseFriend: function (howmany) {
            try {
                var it       = 0,
                    tempGift = '',
                    tempText = '',
                    unselDiv = null,
                    selDiv   = null,
                    first    = true,
                    count    = 0,
                    same     = true;

                if (!utility.isNum(howmany) || howmany < 1) {
                    throw "Invalid howmany! (" + howmany + ")";
                }

                if (config.getItem("GiftChoice", gifting.gifts.options[0]) !== gifting.gifts.options[0]) {
                    same = false;
                }

                for (it = 0; it < this.records.length; it += 1) {
                    this.records[it].chosen = false;

                    if (count >= howmany) {
                        continue;
                    }

                    if (!schedule.since(this.records[it].last || 0, 3600)) {
                        continue;
                    }

                    if (this.records[it].sent) {
                        continue;
                    }

                    if (first) {
                        tempGift = this.records[it].gift;
                        first = false;
                    }

                    if (this.records[it].gift === tempGift || !same) {
                        unselDiv = $("div[class='unselected_list'] input[value='" + this.records[it].userId + "']");
                        if (unselDiv && unselDiv.length) {
                            if (!/none/.test(unselDiv.parent().attr("style"))) {
                                utility.Click(unselDiv.get(0));
                                selDiv = $("div[class='selected_list'] input[value='" + this.records[it].userId + "']").parent();
                                if (selDiv && selDiv.length) {
                                    if (!/none/.test(selDiv.attr("style"))) {
                                        utility.log(1, "User Chosen: ", this.records[it].userId, this.records[it]);
                                        this.records[it].chosen = true;
                                        count += 1;
                                        continue;
                                    } else {
                                        tempText = "Selected id is none:";
                                    }
                                } else {
                                    tempText = "Selected id not found:";
                                }
                            } else {
                                tempText = "Unselected id is none:";
                            }
                        } else {
                            tempText = "Id not found, perhaps gift pending:";
                        }

                        utility.log(1, tempText, this.records[it].userId, this.records[it]);
                        this.records[it].last = new Date().getTime();
                    }
                }

                caap.waitingForDomLoad = false;
                gifting.save("queue");
                return count;
            } catch (err) {
                utility.error("ERROR in gifting.queue.chooseFriend: " + err);
                return undefined;
            }
        },

        sent: function () {
            try {
                var it         = 0,
                    resultDiv  = null,
                    resultText = '',
                    sentok     = false;

                if (window.location.href.indexOf('act=create') >= 0) {
                    resultDiv = $('#app46755028429_results_main_wrapper');
                    if (resultDiv && resultDiv.length) {
                        resultText = resultDiv.text();
                        if (resultText) {
                            if (/You have sent \d+ gift/.test(resultText)) {
                                for (it = this.records.length - 1; it >= 0; it -= 1) {
                                    if (this.records[it].chosen) {
                                        this.records[it].sent = true;
                                        gifting.history.sent(this.records[it]);
                                        this.records.splice(it, 1);
                                    }
                                }

                                utility.log(1, 'Confirmed gifts sent out.');
                                sentok = true;
                            } else if (/You have exceed the max gift limit for the day/.test(resultText)) {
                                utility.log(1, 'Exceeded daily gift limit.');
                                schedule.setItem("MaxGiftsExceeded", 10800, 300);
                            } else {
                                utility.log(1, 'Result message', resultText);
                            }
                        } else {
                            utility.log(1, 'No result message');
                        }
                    }
                } else {
                    utility.log(1, 'Not a gift create request');
                }

                return sentok;
            } catch (err) {
                utility.error("ERROR in gifting.queue.sent: " + err);
                return undefined;
            }
        }
    },

    history: {
        records: [],

        record: function () {
            this.data = {
                userId   : 0,
                name     : '',
                sent     : 0,
                received : 0
            };
        },

        received: function (record) {
            try {
                if (!record || utility.typeOf(record) !== 'object') {
                    throw "Not passed a record";
                }

                if (!utility.isNum(record.userId) || record.userId < 1) {
                    utility.warn("userId", record.userId);
                    throw "Invalid identifying userId!";
                }

                var it        = 0,
                    success   = false,
                    newRecord = {};

                for (it = 0; it < this.records.length; it += 1) {
                    if (this.records[it].userId === record.userId) {
                        if (this.records[it].name !== record.name) {
                            this.records[it].name = record.name;
                        }

                        this.records[it].received += 1;
                        success = true;
                        break;
                    }
                }

                if (success) {
                    utility.log(1, "Updated gifting.history record", this.records[it], this.records);
                } else {
                    newRecord = new this.record().data;
                    newRecord.userId = record.userId;
                    newRecord.name = record.name;
                    newRecord.received = 1;
                    this.records.push(newRecord);
                    utility.log(1, "Added gifting.history record", newRecord, this.records);
                }

                gifting.save("history");
                return true;
            } catch (err) {
                utility.error("ERROR in gifting.history.received: " + err, record);
                return false;
            }
        },

        sent: function (record) {
            try {
                if (!record || utility.typeOf(record) !== 'object') {
                    throw "Not passed a record";
                }

                if (!utility.isNum(record.userId) || record.userId < 1) {
                    utility.warn("userId", record.userId);
                    throw "Invalid identifying userId!";
                }

                var it        = 0,
                    success   = false,
                    newRecord = {};

                for (it = 0; it < this.records.length; it += 1) {
                    if (this.records[it].userId === record.userId) {
                        if (this.records[it].name !== record.name) {
                            this.records[it].name = record.name;
                        }

                        this.records[it].sent += 1;
                        success = true;
                        break;
                    }
                }

                if (success) {
                    utility.log(1, "Updated gifting.history record", this.records[it], this.records);
                } else {
                    newRecord = new this.record().data;
                    newRecord.userId = record.userId;
                    newRecord.name = record.name;
                    newRecord.sent = 1;
                    this.records.push(newRecord);
                    utility.log(1, "Added gifting.history record", newRecord, this.records);
                }

                gifting.save("history");
                return true;
            } catch (err) {
                utility.error("ERROR in gifting.history.sent: " + err, record);
                return false;
            }
        },

        length: function () {
            try {
                return this.records.length;
            } catch (err) {
                utility.error("ERROR in gifting.history.length: " + err);
                return undefined;
            }
        }
    }
};