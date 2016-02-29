'use strict';
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var multivarka = {

    server: function (url) {
        this.url = url;
        return this;
    },

    collection: function (collection) {
        this.collectionName = collection;
        return this;
    },

    where: function (field) {
        this.field = field;
        return this;
    },

    not: function () {
        this.isNot = true;
        return this;
    },

    _setCondition: function (value, ifFalse, ifTrue) {
        var tempObj = {};
        tempObj[this.field] = this.isNot ? ifFalse : ifTrue;
        this.condition = tempObj;
        return this;
    },

    lessThan: function (value) {
        return this._setCondition(value, {$gt: value}, {$lt: value});
    },

    greatThan: function (value) {
        return this._setCondition(value, {$lt: value}, {$gt: value});
    },

    equal: function (value) {
        return this._setCondition(value, {$ne: value}, value);
    },

    include: function (list) {
        return this._setCondition(list, {$nin: list}, {$in: list});
    },

    find: function (callback) {
        return this._connect(callback, function (db, cb) {
            db.collection(this.collectionName).find(this.condition).toArray(cb);
        });
    },

    remove: function (callback) {
        return this._connect(callback, function (db, cb) {
            db.collection(this.collectionName).remove(this.condition, cb);
        });
    },

    set: function (field, value) {
        var tempObj = {};
        tempObj[field] = value;
        this.set = {$set: tempObj};
        return this;
    },

    update: function (callback) {
        return this._connect(callback, function (db, cb) {
            db.collection(this.collectionName).update(this.condition || {}, this.set,
                {multi: true}, cb);
        });
    },

    insert: function (record, callback) {
        return this._connect(callback, function (db, cb) {
            db.collection(this.collectionName).insert(record, cb);
        });
    },

    _connect: function (callback, action) {
        MongoClient.connect(this.url, function (err, db) {
            if (err) {
                callback(err);
            } else {
                action.call(this, db, function (err, data) {
                    callback(err, data);
                    db.close();
                });
            }
        }.bind(this));
        return this;
    }
};

module.exports = multivarka;
