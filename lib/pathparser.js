'use strict';
// функция проверки наличия middleware и правильности задания имени middleware
// где:
//  name - название списка рассылки (строка или regexp)
function pathparser( name, str ) {
  // возврат если name не существует или задан неверно
  // минимальный name '/' или //
  if ( !name || typeof name != 'string')
    return false;

  // возврат если str не существует или задан неверно
  if ( !str || typeof str != 'string')
    return false;

  // возврат true если name строка и соответствует текущему middleware_name
  return string_indexof(name, str);

  // если ни с чем не совпало возвращаем false
  //console.log('6 false', name, middleware_name);
  return false;
};

function string_indexof( name, str) {
  const pos = str.indexOf(name)+1;
  if( pos == 1 )
    return true; //str.substring(pos);
  return false;
}

module.exports = pathparser;
