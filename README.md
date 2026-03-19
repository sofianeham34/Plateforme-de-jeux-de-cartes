# 🎮 Projet Jeux de Cartes en Ligne

Bienvenue sur notre plateforme web de jeux de cartes multijoueurs ! Cette application permet de rassembler plusieurs joueurs en ligne autour de différents jeux de cartes, dans une interface centralisée et interactive.

## 🎲 Jeux disponibles

- 🐂 **6 qui prend**
- ⚔️ **Bataille ouverte**
- 🃏 **8 américain**

## 📖 Contexte du projet

Ce projet a été imaginé et développé au cours de notre deuxième année de **Licence Informatique (L2)**. Il représente l'aboutissement d'un travail de groupe visant à concevoir de A à Z une application web multijoueur.

### 👥 Équipe de développement

- Sami Chbicheb
- Dogukan Tokmak
- Sofiane Hammar
- Aly Hachem Reda

## 🚀 Objectifs principaux

- Créer une **application web ludique et interactive**, offrant une bonne expérience utilisateur.
- Permettre à plusieurs joueurs de se connecter simultanément et de **jouer en ligne** en temps réel.
- Intégrer la logique et les **règles spécifiques** de plusieurs jeux de cartes au sein du même environnement.
- Maîtriser une **architecture client-serveur** et collaborer efficacement autour du code.

## 🛠️ Stack Technique

- **Front-end** : React.js, CSS
- **Back-end** : Node.js, framework Express
- **Base de données** : SQLite (pour la persistance des données)
- **Environnement & Outils** : Git, GitHub, Visual Studio Code

## 📦 Instructions d'installation

Pour exécuter ce projet sur votre machine locale, veuillez suivre les étapes ci-dessous :

### 1. Récupération du projet

Commencez par cloner le dépôt GitHub et installer les dépendances principales :

```bash
git clone https://github.com/laprise221/projetLicence2.git
cd projetLicence2
npm install
```

*(Note : l'installation nécessitera peut-être Python pour la compilation de certains modules comme SQLite).*

### 2. Démarrage du Client (Interface Graphique)

Dans un premier terminal, à la racine du projet, lancez l'application React :

```bash
npm start
```

### 3. Démarrage du Serveur (Logique métier & Base de données)

Ouvrez un **deuxième terminal**, naviguez vers le dossier du serveur et exécutez le script :

```bash
cd serveur
node serveur.js
```

## 🌐 Jouer en ligne

Une fois le client et le serveur démarrés avec succès, ouvrez votre navigateur favori et rendez-vous à l'adresse suivante pour accéder à l'interface de jeu :
👉 **[http://localhost:3000](http://localhost:3000)**

## 📄 Informations de Licence

Ce projet a été réalisé à des **fins strictement pédagogiques** dans le cadre de notre cursus universitaire (Licence 2). 
Toute réutilisation dans un cadre commercial est interdite sans l'autorisation explicite de l'ensemble des auteurs.
