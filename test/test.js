'use strict';

var multivarka = require('./../multivarka.js');
var assert = require('assert');
var sinon = require('sinon');

var petr = {
    name: 'Пётр',
    group: 'ПИ-302',
    grade: 5
};

var clientAPI = function () {
    return {

        connect: function (url, callback) {
            callback(null, this);
        },

        close: function () {
        },

        collection: function () {
            return this;
        },

        find: function () {
            return this;
        },

        remove: function (condition, callback) {
            callback(null, []);
        },

        insert: function (condition, callback) {
            callback(null, []);
        },

        update: function (condition, set, options, callback) {
            callback(null, []);
        },

        toArray: function (callback) {
            callback(null, []);
        }
    };
};

var buggyClientAPI = function () {
    return {

        connect: function (url, callback) {
            throw new Error;
        },

        close: function () {
        },

        collection: function () {
            return this;
        },

        find: function () {
            return this;
        },

        toArray: function (callback) {
            callback(null, []);
        }
    };
};

describe('Тестирование multivarka', function () {
    it('Проверка подключения к бд при неправильном url', function () {

        var client = buggyClientAPI();
        var connectSpy = sinon.spy(client, 'connect');

        multivarka.server('', client)
            .collection('students')
            .where('group').equal('КБ-301')
            .find(function () {
                assert(connectSpy.withArgs('').calledOnce);
            });
    });
    it('Проверка equal', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var findSpy = sinon.spy(client, 'find');

        multivarka.server('fakeurl', client)
            .collection('students')
            .where('group').equal('КБ-301')
            .find(function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(findSpy.withArgs({group: 'КБ-301'}).calledOnce);
            });

    });
    it('Проверка not equal', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var findSpy = sinon.spy(client, 'find');

        multivarka.server('fakeurl', client)
            .collection('students')
            .where('group').not().equal('КБ-301')
            .find(function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(findSpy.withArgs({group: {$ne: 'КБ-301'}}).calledOnce);
            });
    });
    it('Проверка lessThan', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var findSpy = sinon.spy(client, 'find');

        multivarka.server('fakeurl', client)
            .collection('students')
            .where('grade').lessThan(4)
            .find(function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(findSpy.withArgs({grade: {$lt: 4}}).calledOnce);
            });

    });
    it('Проверка not lessThan', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var findSpy = sinon.spy(client, 'find');

        multivarka.server('fakeurl', client)
            .collection('students')
            .where('grade').not().lessThan(4)
            .find(function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(findSpy.withArgs({grade: {$gt: 4}}).calledOnce);
            });

    });

    it('Проверка not moreThan', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var findSpy = sinon.spy(client, 'find');

        multivarka.server('fakeurl', client)
            .collection('students')
            .where('group').not().moreThan(4)
            .find(function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(findSpy.withArgs({group: {$lt: 4}}).calledOnce);
            });

    });
    it('Проверка include', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var findSpy = sinon.spy(client, 'find');

        multivarka.server('fakeurl', client)
            .collection('students')
            .where('group').include(['ПИ-301', 'ПИ-302', 'КБ-301'])
            .find(function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(findSpy.withArgs({group: {$in: ['ПИ-301', 'ПИ-302', 'КБ-301']}}).calledOnce);
            });

    });
    it('Проверка not include', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var findSpy = sinon.spy(client, 'find');

        multivarka.server('fakeurl', client)
            .collection('students')
            .where('group').not().include(['ПИ-301', 'ПИ-302', 'КБ-301'])
            .find(function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(findSpy.withArgs({group: {$nin: ['ПИ-301', 'ПИ-302', 'КБ-301']}})
                    .calledOnce);
            });

    });
    it('Проверка remove', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var removeSpy = sinon.spy(client, 'remove');

        multivarka.server('fakeurl', client)
            .collection('students')
            .where('group').moreThan(4)
            .remove(function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(removeSpy.withArgs({group: {$gt: 4}}).calledOnce);
            });
    });
    it('Проверка insert', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var insertSpy = sinon.spy(client, 'insert');

        multivarka.server('fakeurl', client)
            .collection('students')
            .insert(petr, function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(insertSpy.withArgs(petr).calledOnce);
            });
    });
    it('Проверка set update', function () {

        var client = clientAPI();
        var connectSpy = sinon.spy(client, 'connect');
        var collectionSpy = sinon.spy(client, 'collection');
        var updateSpy = sinon.spy(client, 'update');

        multivarka.server('fakeurl', client)
            .collection('students')
            .where('group').equal('ПИ-301')
            .set('group', 'ПИ-302')
            .update(function () {
                assert(connectSpy.withArgs('fakeurl').calledOnce);
                assert(collectionSpy.withArgs('students').calledOnce);
                assert(updateSpy.withArgs({group: 'ПИ-301'}, {$set: {group: 'ПИ-302'}},
                    {multi: true}).calledOnce);
            });
    });
    describe('Проверка нескольких условий', function () {
        it('Проверка moreThan, not equal', function () {

            var client = clientAPI();
            var connectSpy = sinon.spy(client, 'connect');
            var collectionSpy = sinon.spy(client, 'collection');
            var findSpy = sinon.spy(client, 'find');

            multivarka.server('fakeurl', client)
                .collection('students')
                .where('grade').moreThan(4)
                .where('group').not().equal('ИТ-41')
                .find(function () {
                    assert(connectSpy.withArgs('fakeurl').calledOnce);
                    assert(collectionSpy.withArgs('students').calledOnce);
                    assert(findSpy.withArgs({grade: {$gt: 4}, group: {$ne: 'ИТ-41'}}).calledOnce);
                });
        });
        it('Проверка moreThan, include', function () {

            var client = clientAPI();
            var connectSpy = sinon.spy(client, 'connect');
            var collectionSpy = sinon.spy(client, 'collection');
            var findSpy = sinon.spy(client, 'find');

            multivarka.server('fakeurl', client)
                .collection('students')
                .where('grade').moreThan(4)
                .where('group').include(['ПИ-301', 'ПИ-302', 'КБ-301'])
                .find(function () {
                    assert(connectSpy.withArgs('fakeurl').calledOnce);
                    assert(collectionSpy.withArgs('students').calledOnce);
                    assert(findSpy.withArgs({grade: {$gt: 4}, group:
                    {$in: ['ПИ-301', 'ПИ-302', 'КБ-301']}}).calledOnce);
                });
        });
        it('Проверка moreThan, lessThan, include', function () {

            var client = clientAPI();
            var connectSpy = sinon.spy(client, 'connect');
            var collectionSpy = sinon.spy(client, 'collection');
            var findSpy = sinon.spy(client, 'find');

            multivarka.server('fakeurl', client)
                .collection('students')
                .where('grade').moreThan(1)
                .where('grade').lessThan(4)
                .where('group').include(['ПИ-301', 'ПИ-302'])
                .find(function () {
                    assert(connectSpy.withArgs('fakeurl').calledOnce);
                    assert(collectionSpy.withArgs('students').calledOnce);
                    assert(findSpy.withArgs({grade: {$gt: 1, $lt: 4}, group:
                    {$in: ['ПИ-301', 'ПИ-302']}}).calledOnce);
                });
        });
    });
});
