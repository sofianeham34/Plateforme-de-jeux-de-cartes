/// importer sqlite
const sqlite3 = require('sqlite3');
console.log(sqlite3);

//Création d'une nouvelle base de donnée 
const db = new sqlite3.Database('projet.sql');


db.run(`
  CREATE TABLE IF NOT EXISTS joueur (
    login VARCHAR(50) PRIMARY KEY,
    mdp VARCHAR(100),
    V6quiprend INTEGER DEFAULT 0,
    Vbataille INTEGER DEFAULT 0,
    VHuitAmericain INTEGER DEFAULT 0,
    D6quiprend INTEGER DEFAULT 0,
    Dbataille INTEGER DEFAULT 0,
    DHuitAmericain INTEGER DEFAULT 0,
    idP INTEGER REFERENCES partie(idP)
    
  )
`,(err)=>{
  if (err) throw err;
});

db.run('DROP TABLE IF EXISTS partie',err =>{
 if (err) throw err;
 
 db.run(`
  CREATE TABLE IF NOT EXISTS partie (
    idP INTEGER PRIMARY KEY NOT NULL,
    nbJMax INTEGER,
    partieD INTEGER,
    typeP VARCHAR(20),
    loginC VARCHAR(50) REFERENCES joueur(login)
  )
`,(err)=>{
  if (err) throw err;
});

});
db.run("DROP TABLE IF EXISTS partiesSauvegardees",err=>{
  if(err) throw err;

db.run(`CREATE TABLE IF NOT EXISTS partiesSauvegardees (
  idP INTEGER PRIMARY KEY NOT NULL,
  paquet TEXT,
  typeP VARCHAR(20),
  loginC VARCHAR(50) REFERENCES joueur(login)) `, err =>{
    if(err) throw err;
  });
}
  );

  //db.run(`DROP TABLE joueur`);


  module.exports = db;