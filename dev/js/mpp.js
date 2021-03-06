﻿var tabCode = 'mpp';  // TEMP

// элементы страницы
var selGroups = '#groups';
var inpOwner = '#groupID';
var btnExec = '#execute';
var selFilter = '#filter';
var divPosts = "#postsContent";  // контейнер для постов
var inpCount = '#count';  // количество записи для поиска
var inpCountOut = '#countOut';  // количество записей для вывода
var inpOffset = '#offset';  // смещение записей
var selSort = '#sort';
var chbIsContent = '#isContent';
var inpDateIn = "#dateIn";
var inpDateOut = "#dateOut";
var chbOnDateIn = '#onDateIn';
var chbOnDateOut = '#onDateOut';
var btnResetGroupID = '#btn-reset-groupID';
var btnUpdGroups = '#btn-upd-groups';


var reLink = /([-a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/?[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?)/gi;  // CHECK

var posts;  // полученные посты
var countOut;  // количество постов на вывод
var typeOfSort;  // тип сортировки
var isContent;  // необходимость вывода прикреплений
var code = '';

var htmlTemplate = {
    postStart:          '<div class="panel panel-default"><div class="list-group">',
    postEnd:            '<p class="list-group-item">' +
                            '<button title="Лайки" class="btn action" type="button" disabled="disabled">' +
                               '<span class="glyphicon glyphicon-heart" aria-hidden="true"></span> {0}' +
                            '</button>' +
                            '<button title="Репосты" class="btn action" type="button" disabled="disabled">' +
                               '<span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> {1}' +
                            '</button>' +
                            '<button title="Комментарии" class="btn action" type="button" disabled="disabled">' +
                            '<span class="glyphicon glyphicon-comment" aria-hidden="true"></span> {2}' +
                            '</button>' +
                            '<button title="Скорость" class="btn action" type="button" disabled="disabled">' +
                               '<span class="glyphicon glyphicon-dashboard" aria-hidden="true"></span> {3}' +
                            '</button>' +
                        '</p>' +
                        '<p class="list-group-item">' +
                            '<span title="Дата создания записи" class="action">{4}</span>' +
                            '<a title="Открыть запись в новом окне" class="btn action post-link" href="https://vk.com/wall{5}_{6}" target="_blank" role="button">' +
                                'Перейти к записи' +
                            '</a>' +
                        '</p>' +
                        '</div></div>',
    blockPhotoStart:    '<div class="list-group-item photo-block"><div class="row">',
    blockPhoto:         '<div class="col-xs-2">' +
                            '<a href="{0}" target="_blank"><img src="{1}"></a>' +
                        '</div>',
    blockPhotoEnd:      '</div></div>',
    blockAudioStart:    '<div class="list-group-item">',
    audio:              '<audio src="{0}" controls></audio>',
    blockAudioEnd:      '</div>'
};


/** ОБНОВЛЕНИЯ СПИСКА ГРУПП В ВЫПАДАЮЩЕМ СПИСКЕ */
function upd_group_list() {
    $(btnExec).prop("disabled", true);
    var groups;
    VK.api(
        'groups.get',
        {filter: 'groups, publics, events', extended: 1},
        function (data) {
            if (!is_error(data)) {
                groups = data['response']['items'];
                // добавляем группы в выпадающий список
                var options = '';
                $(selGroups).empty();  // очищаем список
                for (var i = 0; i < groups.length; i++) {
                    var group = groups[i];
                    options += '<option value="-{0}">{1}</option>'.format(group['id'], group['name']);
                }
                $(selGroups).append(options);
                $(btnExec).prop("disabled", false);
            }
        }
    );
}


/** Обновление списка источников новостей в выпадающем списке */
function upd_source_list() {
    // TODO
}

/** Вывод постов */
function display_posts() {
    countOut = Number($(inpCountOut).val());
    typeOfSort = $(selSort).val();  // вид сортировки
    isContent = $(chbIsContent).prop("checked");  // необходимость показа прикреплений

    $(divPosts).empty();

    console.log('Записи: ', posts);
    if (posts.length === 0) {
        console.info('MPP. Записей не найдено');
        alert('Записей не найдено');
    }
    else if (!is_error(posts)) {
        //  выборка постов по дате
        // TODO срочно переделать!
        if ($(chbOnDateIn).prop("checked")) {
            posts = posts.filter(function (post) {
                return post['date'] > (moment($(inpDateIn).val(), 'DD/MM/YYYY H:mm').format('X'));
            });
        }
        if ($(chbOnDateOut).prop("checked")) {
            posts = posts.filter(function (post) {
                return post['date'] < (moment($(inpDateOut).val(), 'DD/MM/YYYY H:mm').format('X'));
            });
        }

        // расчёт скорости набора лайков
        var currentTime = new Date().getTime() / 1000;
        for (var i = 0; i < posts.length; i++) {
            // скорость = количество лайков / (текущая дата - дата публикации записи) [1/день]
            posts[i]['speed'] = Number((posts[i]['likes']['count'] / (currentTime - posts[i]['date']) * 86400).toFixed(2));
        }

        // сортировка записей
	    // TODO
        var sorts = {byLikes: ['likes', 'count'],
                     byReposts: ['reposts', 'count'],
                     byComments: ['comments', 'count'],
                     bySpeed: ['speed']};
	
        if (typeOfSort === 'byTimeAsc') {
            posts = posts.reverse();
        }
	    else if (typeOfSort !== 'byTimeDesc') {
        	posts.sort(function (a, b) {
            	a = sorts[typeOfSort].length === 1 ? a[sorts[typeOfSort][0]] : a[sorts[typeOfSort][0]][sorts[typeOfSort][1]];
            	b = sorts[typeOfSort].length === 1 ? b[sorts[typeOfSort][0]] : b[sorts[typeOfSort][0]][sorts[typeOfSort][1]];
            	if (a < b) {return 1}
            	else if (a > b) {return -1}
            	else {return 0}
        	});
	}

        console.log('На вывод: ', posts);

        code = '';
        for (var k = 0; k < countOut; k++) {
            // если постов на вывод больше реального их количества
            if (posts[k] === undefined) {
                break;
            }
            make_post(posts[k]);
        }

        $(divPosts).append($(code));
    }
    // разблокировка кнопки выборки
    $(btnExec).val('Произвести выборку');
    $(btnExec).prop("disabled", false);
    resize_frame();
}


/**
 * ГЕНЕРАЦИЯ HTML-КОДА ДЛЯ ПОСТА
 * Добавляет HTML-код для вывода постов в глобальную переменную code
 * @param {object} post - запись
 */
function make_post(post) {
    function zfill(val) {
        // ДОПОЛНЕНИЕ ЧИСЛА НУЛЁМ СЛЕВА ПРИ НЕОБХОДИМОСТИ
        val = String(val);
        return (val.length == 1) ? '0' + val : val;
    }

    // if ($(chbExclPinPost).prop("checked") && post['is_pinned'] === 1) {return;}  // исключение закреплённой записи

    // составление даты записи
    var date = new Date(post['date'] * 1000);
    date = zfill(date.getDate()) + '.' + zfill(Number(date.getMonth()) + 1) + '.' + date.getFullYear()  + ' ' + zfill(date.getHours()) + ':' + zfill(date.getMinutes());

    // начало записи
    code += htmlTemplate.postStart;
    // если имеется текст
    if (post['text'].length > 0 && isContent) {
        // заменяем ссылке в тексте на реальные, добавляем переносы строк
        var text = post['text']
            .replace(reLink, function(s){
                var str = (/:\/\//.exec(s) === null ? "http://" + s : s );  // CHECK
                return '<a href="'+ str + '">' + s + '</a>';
            })
            .replace(/\n/g, '<br>');
        code +=
            '<p class="list-group-item">' +
            text +
            '</p>'
    }
    // если имеются прикрепления
    // REVIEW
    if (post['attachments'] && isContent) {
        // списки с каждым типом прикреплений
        // TODO другие виды прикреплений
        var listPhoto = post['attachments'].filter( function(attach) {
                return attach.type == 'photo'
            } );
        var listAudio = post['attachments'].filter( function(attach) {
                return attach.type == 'audio'
            } );

        if (listPhoto.length > 0) {
            // console.log('Изображения: ', listPhoto);
            code += htmlTemplate.blockPhotoStart;
            for (var j = 0; j < listPhoto.length; j++) {
                var photo = listPhoto[j]['photo'];
                // поиск версии изображения с наибольшим разрешением
                var linkBigPhoto;
                var resolution = [2560, 1280, 807, 604, 130, 75];  // возможные разрешения
                for (var m = 0; m < resolution.length; m++) {
                    if (photo['photo_' + resolution[m]]) {
                        linkBigPhoto = photo['photo_' + resolution[m]];
                        break;
                    }
                }
                code += htmlTemplate.blockPhoto.format(linkBigPhoto, photo['photo_130'] ? photo['photo_130'] : photo['photo_75']);
            }
            code += htmlTemplate.blockPhotoEnd;
        }
        // TODO все аудиозаписи могут быть заблокированы/удалены
        if (listAudio.length > 0) {
            // console.log('Аудио: ', listAudio);
            code += htmlTemplate.blockAudioStart;
            for (var q = 0; q < listAudio.length; q++) {
                var audio = listAudio[q]['audio'];
                if (audio['url'] == 0) {continue}  // если не указан url аудиозаписи
                code += htmlTemplate.audio.format(audio['url']);
            }
            code += htmlTemplate.blockAudioEnd;
        }
    }
    // конец записи
    code += htmlTemplate.postEnd.format(post['likes']['count'],
                                        post['reposts']['count'],
                                        post['comments']['count'],
                                        post['speed'],
                                        date,
                                        post['from_id'],
                                        post['id']);
}


// ПОЛУЧЕНИЕ СПИСКА ЗАПИСЕЙ
$(btnExec).click( function() {
    // блокировка кнопки выборки
    $(btnExec).prop("disabled", true);
    $(btnExec).val('[ обновляется ]');

    var ownerInfo = $(inpOwner).val();
    var count = Number($(inpCount).val());  // количество записей для анализа
    var offset = Number($(inpOffset).val());  // смещение  для выборки записей
    var filter = $(selFilter).val();
    var id = '';
    var domain = '';

    if (ownerInfo.length > 0) {
        // извлечение идентификатора страницы
        // TODO дописать для адресов типа club, public
        if (ownerInfo.search(/^-?[0-9]+$/) != -1) {
            id = ownerInfo;
        }
        else {
            var _ = ownerInfo.search('vk.com/');
            if (_ != -1) {
                domain = ownerInfo.slice(_ + 7);
            }
            else {
                domain = ownerInfo;
            }
        }
    }
    else {
        id = $(selGroups).val();
    }

    // ФОРМИРОВАНИЕ ЗАПРОСА НА ПОЛУЧЕНИЕ ПОСТОВ
    if (count > 100) {
        _ = (id.length > 0)
            ? ('owner_id: ' + id)
            : ('domain: "' + domain + '"');
        var query = 'var posts;' +
                    'var offset = ' + offset + ';' +
                    'var tmpParam;' +
                    'var countPosts;' +  // количество записей на стене
                    'var countQuery = 0;' +  // количество выполненных запросов к api (ограничение в 25)
                    'var count = ' + count + ';' +
                    'tmpParam = API.wall.get({' + _ + ', count: 100, offset: offset, filter: "' + filter + '"});' +
                    'posts = tmpParam.items;' +
                    'countPosts = tmpParam.count;' +
                    'if (countPosts <= 100) {' +
                        'return posts;' +
                    '}' +
                    'offset = offset + 100;' +
                    'while(posts.length < count && countQuery < 24) {' +
                        'tmpParam = API.wall.get({' + _ + ', count: 100, offset: offset, filter: "' + filter + '"});' +
                        'posts = posts + tmpParam.items;' +
                        'if (tmpParam.count < 100) {return posts;}' +
                        'countQuery = countQuery + 1;' +
                        'offset = offset + 100;' +
                    '}' +
                    'return posts;';
        // console.log('execute-запрос: ', query);
        VK.api(
            'execute',
            {code: query},
            function(data) {
                posts = data['response'];
                display_posts();
            }
        );
    }
    // else if (count > 2500) {
        // TEMP дописать
    // }
    else {
        var params = (id.length > 0)
                     ? {owner_id: id, count: count, filter: filter, offset: offset}
                     : {domain: domain, count: count, filter: filter, offset: offset};
        VK.api(
            'wall.get',
            params,
            function(data) {
                if (!is_error(data)) {
                    posts = data['response']['items'];
                    display_posts();
                }
            }
        );
    }
});


/** Сброс поля с ID группы/пользователя */
$(btnResetGroupID).click( function () {
    $(inpOwner).val('');
});


/** Обновить список групп */
$(btnUpdGroups).click( upd_group_list );


// подгрузка дополнительных записей
// TODO оптимизировать
VK.addCallback('onScroll', function (scrollTop, windowHeight) {
    // console.log(scrollTop, windowHeight, $("html").height());
    if ((posts !== undefined) && ($('html').height() - scrollTop - 429 <= 0)) {
        code = '';
        for (var n = 0; n < 10; n++) {
            countOut += 1;
            if (posts.length <= countOut) {break;}
            make_post(posts[countOut]);
        }
        $(divPosts).append(code);
        resize_frame();
    }
});


// КАЛЕНДАРИ
$(chbOnDateIn).change(function () {
    $(inpDateIn).prop("disabled", !$(this).prop("checked"));
});

$(chbOnDateOut).change(function () {
    $(inpDateOut).prop("disabled", !$(this).prop("checked"));
});

var fields = [inpDateIn, inpDateOut];
for (var i = 0; i < 2; i++) {
    $(fields[i]).daterangepicker({
        "singleDatePicker": true,
        "timePicker": true,
        "timePicker24Hour": true,
        "autoApply": true,
        "startDate": i === 1 ? moment().add(1, 'hour') : moment().subtract(30, 'days'),
        "opens": "left",
        "drops": "up",
        "applyClass": "btn-primary",
        locale: {
            format: 'DD/MM/YYYY H:mm'
        }
    });
}
