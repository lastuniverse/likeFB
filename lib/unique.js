var id_num = 0;

function uniq_id(){
	id_num++;
	var date = new Date();
	var id = date.getTime();
	var plus = ''+id_num;
	var len = plus.length;
	for(var i=len;i<3;i++){
		plus='0'+plus;
	}
	return id+plus;
}

module.exports = uniq_id;