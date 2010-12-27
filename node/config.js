exports.couch = {
	d10: {dsn: "http://localhost:5984/",database:"d10-test"},
	auth: {dsn: "http://localhost:5984/",database:"auth-test"},
	track: {dsn: "http://localhost:5984/",database:"track-test"}
};

// templates path
exports.templates = {
	node: "../views/"
};

// cookie name
exports.cookieName = "goodcacke";
exports.cookiePath = "/";

// cookie time to live ( in miliseconds )
exports.cookieTtl = 1000*60*60*24*15;

// results per page
exports.rpp = 30;

exports.audio = {
	tmpdir: "../audio/tmp",
	dir: "../audio/files"
};

exports.cmds = {
	file: "/usr/bin/file",
	file_options: "-bi",
	lame: "/usr/bin/lame",
	lame_opts:  ["--mp3input","--quiet","--decode","-","-"],
	oggenc: "/usr/bin/oggenc",
	oggenc_opts: ["--quiet","-o"],
	ogginfo: "/usr/bin/ogginfo",
	utrac: "/usr/local/bin/utrac",
	taginfo: "/usr/local/bin/taginfo",
	vorbiscomment: "/usr/bin/vorbiscomment"
	
}


exports.javascript = {
	includes : [
		"modernizr-1.5.min.js",
		"jquery.sprintf.js",
		"jquery.tools.min.js",
		"jquery.csstransform.js",
		"jquery.ovlay.js",
		"jquery.includes.js",
		"dnd.js",
		"utils.js",
		"track.js",
		"player.js",
		"menumanager.js",
		"httpbroker.js",
		"playlist.js",
		"paginer.js",
		"plm.js",
		"my.js",
		"upload.js",
		"library.js",
		"welcome.js",
		"results.js",
		"user.js",
		"osd.js",
		"localcache.js",
		"bgtask.js"
	]
};


exports.emailSender = "root@10er10.com";
exports.emailSenderLabel = "Deezer10";
exports.invites = {
	ttl:7 ,
	url: "http://invites.10er10.com/index.php/code/{{id}}",
	subject: "Invitation: découvrez Deezer10",
	message: "Bonjour !\n\n"+
"Un de vos amis a pensé à vous! Ceci est une invitation pour découvrir Deezer10, un site web privé d'écoute et de partage de musique.\n\n"+
"Deezer10 vous permet d'enregistrer vos morceaux MP3 et OGG, de les écouter, de créer vos propres playlists. Vous bénéficiez ainsi d'une discothèque disponible à tout moment sur Internet, que vous soyez cher vous, chez vos amis, au travail... Deezer10 utilise les dernières technologies HTML5, c'est pourquoi il vous faut un navigateur moderne pour que le site fonctionne correctement. Nous vous conseillons Mozilla Firefox ou Google Chrome.\n\n"+
"Personne ne connait mieux que vous votre musique. C'est pourquoi nous ne vous demandons pas de mettre toutes vos chansons sur le serveur, mais uniquement le meilleur, la crème de la créme. C'est aussi pourquoi, une fois que vous enregistrez une chanson sur le serveur, nous vous demandons de la valider : ceci permet d'avoir un index à jour du contenu des morceaux (artistes, titres, genres musicaux), afin que le catalogue soit le plus pertinent possible.\n\n"+
"Deezer10 respecte votre vie privée : le serveur web n'enregistre pas les connexions, nous ne gardons pas votre adresse email... Alors attention ! Il est indispensable que vous reteniez bien votre login et votre mot de passe : le site n'a aucun moyen de vous le renvoyer si vous l'avez oublié. Notez-le, envoyez-le vous par email...\n\n"+
"Cette invitation est valide pendant {{ttl}} jours. Pour créer votre compte, connectez vous dès maintenant ici :\n\n"+
"{{>url}}\n\n"+
"A bientôt,\n\n"+
"Le staff\n"
}
		
		

exports.genres = [
'Blues',
'Classic Rock',
'Country',
'Dance',
'Disco',
'Funk',
'Grunge',
'Hip-Hop',
'Jazz',
'Metal',
'New Age',
'Oldies',
'Other',
'Pop',
'R&B',
'Rap',
'Reggae',
'Rock',
'Techno',
'Industrial',
'Alternative',
'Ska',
'Death Metal',
'Pranks',
'Soundtrack',
'Euro-Techno',
'Ambient',
'Trip-Hop',
'Vocal',
'Jazz+Funk',
'Fusion',
'Trance',
'Classical',
'Instrumental',
'Acid',
'House',
'Game',
'Sound Clip',
'Gospel',
'Noise',
'Alternative Rock',
'Bass',
'Soul',
'Punk',
'Space',
'Meditative',
'Instrumental Pop',
'Instrumental Rock',
'Ethnic',
'Gothic',
'Darkwave',
'Techno-Industrial',
'Electronic',
'Pop-Folk',
'Eurodance',
'Dream',
'Southern Rock',
'Comedy',
'Cult',
 'Gangsta',
'Top 40',
'Christian Rap',
'Pop/Funk',
'Jungle',
'Native US',
'Cabaret',
'New Wave',
'Psychedelic',
'Rave',
'Showtunes',
'Trailer',
 'Lo-Fi',
'Tribal',
'Acid Punk',
 'Acid Jazz',
 'Polka',
 'Retro',
'Musical',
'Rock & Roll',
'Hard Rock',
'Folk',
'Folk-Rock',
'National Folk',
'Swing',
'Fast Fusion',
'Bebob',
'Latin',
'Revival',
'Celtic',
'Bluegrass',
'Avantgarde',
'Gothic Rock',
'Progressive Rock',
'Psychedelic Rock',
'Symphonic Rock',
'Slow Rock',
'Big Band',
'Chorus',
'Easy Listening',
'Acoustic',
'Humour',
'Speech',
'Chanson',
'Opera',
'Chamber Music',
'Sonata',
'Symphony',
'Booty Bass',
'Primus',
'Porn Groove',
'Satire',
'Slow Jam',
'Club',
'Tango',
'Samba',
'Folklore',
'Ballad',
'Power Ballad',
'Rhytmic Soul',
'Freestyle',
'Duet',
'Punk Rock',
'Drum Solo',
'Acapella',
'Euro-House',
'Dance Hall',
'Goa',
'Drum & Bass',
'Club-House',
'Hardcore',
'Terror',
'Indie',
'BritPop',
'Negerpunk',
'Polsk Punk',
'Beat',
'Christian Gangsta',
'Heavy Metal',
'Black Metal',
'Crossover',
'Contemporary C',
'Christian Rock',
'Merengue',
'Salsa',
'Thrash Metal',
'Anime',
'JPop',
'SynthPop',
'Dub'
];