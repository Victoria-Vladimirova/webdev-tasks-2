'use strict';
var MongoClient = require('mongodb').MongoClient;

/**
 * Метод для задания URL сервера, одновременно является точкой входа в билдер запросов
 * @param url url для подключения
 * @param client Опциональный клиент mongodb, используется для возможности подмены в тестах
 * @returns {QueryBuilder} новый объект QueryBuilder
 */
module.exports.server = function (url, client) {
    return new QueryBuilder(url, client);
};


/**
 * Строит запрос
 * @param url url для подключения
 * @param client Опциональный клиент mongodb, используется для возможности подмены в тестах
 * @constructor
 */
var QueryBuilder = function (url, client) {

    var builder = this;

    client = client || MongoClient;

    this._url = url;

    /**
     * Задает имя коллекции в MongoDB
     * @param collection имя коллекции в MongoDB
     * @returns {ActionStep} новый объект ActionStep - следующий шаг построения запроса
     */
    this.collection = function (collection) {
        builder._collectionName = collection;
        return new ActionStep(builder);
    };

    /**
     * Подключение к MongoDB и выполнение action
     * @param callback пользовательский коллбэк, переданный в метод действия (find/update/remove...)
     * @param action функция, реализующая действие с выборкой
     * @returns {QueryBuilder} билдер для связки
     * @private
     */
    this._connect = function (callback, action) {
        client.connect(builder._url, function (err, db) {
            if (err) {
                callback(err);
            } else {
                action.call(builder, db.collection(builder._collectionName), function (err, data) {
                    callback(err, data);
                    db.close();
                });
            }
        });
        return builder;
    };
};

/**
 * Добавляет условие в запрос
 * Содержит методы, которые могут идти после where
 * @param builder билдер запроса
 * @constructor
 */
var ConditionStep = function (builder) {

    var where = this;

    builder._isNot = false;

    /**
     * Устанавливает условие, с которым будет выполняться запрос в зависимости от наличия метода not
     * @param negative условие, если был вызов not
     * @param positive условие, если не было вызова not
     * @returns {ActionStep} объект для следующего шага
     * @private
     */
    var _setCondition = function (negative, positive) {
        var condition = {};
        condition[builder._field] = builder._isNot ? negative : positive;
        builder._condition = condition;
        return new ActionStep(builder);
    };

    /**
     * Добавляет отрицание к следующему за этим оператором значению
     * @returns {ConditionStep} текущий объект
     */
    this.not = function () {
        builder._isNot = !builder._isNot;
        return where;
    };

    /**
     * Добавляет условие, что значение найденных записей будет меньше value
     * @param value значение для условия сравнения
     * @returns {ActionStep} объект для следующего шага
     */
    this.lessThan = function (value) {
        return _setCondition({$gt: value}, {$lt: value});
    };

    /**
     * Добавляет условие, что значение найденных записей будет больше value
     * @param value значение для условия сравнения
     * @returns {ActionStep} объект для следующего шага
     */
    this.moreThan = function (value) {
        return _setCondition({$lt: value}, {$gt: value});
    };

    /**
     * Добавляет условие, что значение найденных записей будет равно value
     * @param value значение для условия сравнения
     * @returns {ActionStep} объект для следующего шага
     */
    this.equal = function (value) {
        return _setCondition({$ne: value}, value);
    };

    /**
     * Добавляет условие, что в найденных записях будет поле из указанного набора полей
     * @param list набор полей
     * @returns {ActionStep} объект для следующего шага
     */
    this.include = function (list) {
        return _setCondition({$nin: list}, {$in: list});
    };
};

/**
 * Добавляет в запрос действие, которое будет производится над коллекцией
 * @param builder
 * @constructor
 */
var ActionStep = function (builder) {

    // проверяем, что ещё не было вызова where
    if (!builder._field) {

        /**
         * Задает поле, по которому будет осуществляться сравнение
         * разрешаем вызывать where только один раз в цепочке
         * @param field поле для сравнения
         * @returns {ConditionStep} объект для следующего шага — выбора условия
         */
        this.where = function (field) {
            builder._field = field;
            return new ConditionStep(builder);
        };

        /**
         * Завершающее действие — добавляет запись в коллекцию
         * Может быть вызван только если не было вызова where
         * @param record запись, которая будет добавлена в коллекцию
         * @param callback пользовательский коллбэк, куда передаются резульаты вставки
         */
        this.insert = function (record, callback) {
            return builder._connect(callback, function (collection, cb) {
                collection.insert(record, cb);
            });
        };

    }

    /**
     * Задает поле и значение, которые будут обновлены на шаге UpdateStep
     * @param field поле, которое будет обновлено
     * @param value значение, которое будет присвоено полю
     * @returns {UpdateStep} объект для следующего шага — вызова функции обновления
     */
    this.set = function (field, value) {
        var set = {};
        set[field] = value;
        builder._set = {$set: set};
        return new UpdateStep(builder);
    };

    /**
     * Завершающее действие — поиск в коллекции по условию
     * @param callback пользовательский коллбэк, куда передаются результаты запроса
     */
    this.find = function (callback) {
        return builder._connect(callback, function (collection, cb) {
            collection.find(builder._condition).toArray(cb);
        });
    };

    /**
     * Завершающее действие — удаление найденных записей из коллекции
     * @param callback пользовательский коллбэк, куда передаются результаты удаления
     */
    this.remove = function (callback) {
        return builder._connect(callback, function (collection, cb) {
            collection.remove(builder._condition, cb);
        });
    };

};

/**
 * Шаг билдера для обновления поля в записях коллекции
 * @param builder билдер
 * @constructor
 */
var UpdateStep = function (builder) {
    /**
     * Завершающее действие — обновление записи
     * @param callback пользовательский коллбэк, куда передаются результаты обновления
     * @returns {QueryBuilder} билдер
     */
    this.update = function (callback) {
        return builder._connect(callback, function (collection, cb) {
            collection.update(builder._condition || {}, builder._set, {multi: true}, cb);
        });
    };
};
