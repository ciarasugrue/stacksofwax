const express = require('express');
const path = require('path');
let app = express();
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');

app.set('view engine', 'ejs');
//this static line wasn't used in week 9, just fyi if it becomes redundant
app.use(express.static(path.join(__dirname, '/public')));

app.use(express.urlencoded({ extended: true }));

const hour = 1000 * 60 * 60 * 1;

app.use(cookieParser());

app.use(sessions({
    secret: "letmein12356",
    saveUninitialized: true,
    cookie: { maxAge: hour },
    resave: false 
}));

const connection = mysql.createConnection({
  host:'localhost',
  user: 'root',
  password: 'root',
  database: 'stacksofwax',
  port: '3306',
  multipleStatements: true
});

connection.connect((err)=>{
  if(err) return console.log(err.message);
  console.log("connected to local mysql db");
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/collection', (req, res) => {
  let read = `SELECT album_id, album_name, year, album_artwork_url FROM album`;
  connection.query(read, (err, albumdata) => {
    if (err) throw err;
  //  console.table(albumdata);
  res.render('collection', {albumdata});
  });
});

app.get("/vinyl", (req, res) => {
  let getid = req.query.vid;
  let getrow = `SELECT album.album_id, album.album_name, album.number_tracks, album.year, 
                album.record_company, album.album_artwork_url, artist.artist_name
                FROM album 
                INNER JOIN artist
                ON album.artist_id = artist.artist_id
                WHERE album_id = ?;
                SELECT track.track_name, track.track_length 
                FROM album_track 
                INNER JOIN track
                ON album_track.track_id = track.track_id
                WHERE album_id = ?`;
                
  connection.query(getrow, [getid, getid], (err, albumrow)=> {
    if(err) throw err;
    let albumdeets = albumrow[0];
    let albumtracks = albumrow[1];
   // console.table(albumdeets);
   // console.table(albumtracks);

    res.render('vinyl', {albumdeets, albumtracks});
  });
 
});
    
app.get("/login", (req, res)=>{
  res.render('login');
});

//not sure if this should eventually become .post('/login')
app.post('/', (req,res) => {
  let username = req.body.usernameField;
  let checkuser = 'SELECT * FROM user WHERE user_name = ? ';

  connection.query(checkuser, [username], (err, rows)=>{
      if(err) throw err;
      let numRows = rows.length;
      if(numRows > 0){
        let sessionobj = req.session;  
        sessionobj.authen = rows[0].user_id; 
        res.redirect('/dashboard');
    }else{
        res.redirect('/');
    }
  });
});

app.get('/dashboard', (req,res) => {
  let sessionobj = req.session;
    if(sessionobj.authen){
      let uid = sessionobj.authen;
      let user = 'SELECT * FROM user WHERE user_id = ?';
      connection.query(user, [uid], (err, row)=>{ 
          let firstrow = row[0];
          res.render('dashboard', {userdata:firstrow});
      });
  }else{
      res.send("denied");
  } 
});


app.listen(process.env.PORT || 3000);
console.log('Server is listening on http://localhost:3000/');