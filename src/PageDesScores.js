import React, {useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom"; //Bibliothèque qui gère les routes
const socket = io.connect("http://localhost:3001");

const PageDesScores = ()=>{

    const [scores,setScores] = useState([]);
    useEffect(()=>{
        socket.emit("demandeScores");
    },[]);
    useEffect(()=>{
        socket.on("demandeScores",scores=>{
            setScores(scores);
            console.log("les scores", scores);
        });
    },[socket]);

    const styleObjet = {
        "--bs-scroll-height": "100px",
      };
    return (
    <div className="backGris">
    
    <nav
        className="navbar navbar-expand-lg bg-body-tertiary"
        data-bs-theme="dark"
      >
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
           Page Des Scores
          </a>

            <ul
              className="navbar-nav ml-auto my-2 my-lg-0 navbar-nav-scroll"
              style={styleObjet}
            >
              <li className="nav-item">
                <a className="nav-link" href="./Menu">Retour à l'accueil</a>
              </li>
            </ul>
          </div>
      </nav>
      <div style={{ width: "100%", height: "86vh" }}> 
        <table className="table table-dark table-striped full-page-table">
            <thead>
                <tr>
                <th scope="col">#</th>
                <th scope="col">Nom</th>
                <th scope="col">Score : Bataille Ouverte</th>
                <th scope="col">Score : 6 Qui Prend </th>
                <th scope="col">Score : 8 Americain</th>
                <th scope="col">Pourcentage Victoire</th>
                </tr>
            </thead>
            <tbody>
                 {scores && scores.map((score, index) => (
                    
                    <tr key={index}>
                         <th scope="row">{index+1}</th>
                         <td>{score.login}</td>
                         <td>{score.Vbataille}</td>
                         <td>{score.V6quiprend}</td>
                         <td>{score.VHuitAmericain} </td>
                         <td>{100*((score.Vbataille+score.V6quiprend+score.VHuitAmericain)/(score.Vbataille+score.V6quiprend+score.VHuitAmericain+score.Dbataille+score.D6quiprend+ score.DHuitAmericain)).toFixed(2)}%</td>
                    </tr>
                ))}
        

                
            </tbody>
            </table>

     
    
        </div>
        </div>
    )
   
};
 export default PageDesScores;