# Immersion Facile

Le but du projet immersion facile est de faciliter les immersions professionnelles.
Il y pour cela plusieurs axes de travail:
- Dématérialisé entièrement les demandes d'immersion et les intéractions des conseillers pole emploi ou mission locale
- Constituer un annuaire des entreprises qui sont suceptible d'accueillir en immersion
- Rendre les immersions recherchables par les bénéficiaires

### Prérequis

Pour démarrer le projet il vous faut `git`, `docker` et `node` (verson > 12 )installé sur la machine. 

### Démarrer le projet

Il faut demander d'être ajouté au projet sur le gitlab de pole-emploi. L'url du projet est la suivante :
[https://git.beta.pole-emploi.fr/jburkard/immersion-facile](https://git.beta.pole-emploi.fr/jburkard/immersion-facile)

Récuppérer ou pousser du code sur gitlab, il faut également avoir (ou générer) une paire de clé ssh et **donner la clé public à l'équipe pole-emploi**.
Le but étant de donner les droits sur gitlab et sur la machines de recette.


#### Exemple de création de clé ssh (en général à la racine de l'utilisateur) :
```sh
ssh-keygen -t ed25519 -C "your_email@example.com"
```

#### Cloner le projet :
```sh
git clone ssh://git@git.beta.pole-emploi.fr:23/jburkard/immersion-facile.git immersion-facile;
cd immersion-facile;
```

#### Faire une copie du `.env.sample` qui devra s'appeler `.env`:
```sh
cp .env.sample .env
```

Le `.env` permet de configurer le mode de fonctionnement de l'application.
Par default tous les services sont IN_MEMORY.
On peut lancer avec une base de données postgres simplement en mettant `REPOSITORIES="PG"`.
Le conteneur faisant partie du docker-compose et la PG_URL étant fourni, cela devrait fonctionner sans autre configuration.


Les autres services ont une implémentation IN_MEMORY mais pour fonctionner avec les véritables services il faut fournir les secrets /clés API.
Ce n'est pas censé être nécessaire en local, si jamais c'était le cas, veuillez vous rapprocher de l'équipe.


#### Lancer le projet avec docker-compose
```sh
docker-compose up --build
```

#### Sans docker-compose
Pour utiliser la DB postgres, il faut soit installer postgres sur sa machine, soit lancer postgres dans un container.
Nous avons un docker-compose prévue à cet effet, qui va uniquement rendre une DB postgres disponible (mais le lancera aucun autre service).

Pour le lancer : 
```sh
docker-compose -f docker-compose.resources.yml up --build
```

Pour le backend se référer ensuite ici:
[Documentation backend](./back/README.md)

Pour le frontend se référer ensuite ici:
[Documentation frontend](./front/README.md)
- 