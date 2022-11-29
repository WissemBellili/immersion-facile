import React from "react";

export type Texts = typeof immersionTexts;

export const immersionTexts = {
  yes: "Oui",
  no: "Non",
  welcome: (
    <>
      <strong>Bravo !</strong>
      <p className="fr-text">
        Vous avez trouvé votre entreprise accueillante. Complétez ce formulaire
        avec votre entreprise accueillante et initiez une convention pour
        réaliser votre immersion professionnelle.
      </p>
      <p className="fr-text--xs fr-mt-1w">
        Ce formulaire vaut équivalence du CERFA 13912 * 04
      </p>
    </>
  ),
  copyLinkTooltip: "Copier le lien pour partager le formulaire",
  linkCopied: "Lien copié !",
  shareLinkByMail: {
    share: "Partagez cette demande de Convention par e-mail",
    sharedSuccessfully:
      "Cette demande de Convention a bien été partagée par mail.",
    errorWhileSharing: "Erreur lors de l'envoi de l'email",
  },
  sectionTitles: {
    beneficiary: "1. Informations du candidat",
    establishment: "2. Coordonnées de l'entreprise",
    conditionsToHost: "3. Conditions d’accueil de l’immersion professionnelle",
  },
  signatures: {
    fixErrors: "Veuillez corriger les champs erronés",
  },
  conventionTitle:
    "Formulaire pour conventionner une période de mise en situation professionnelle (PMSMP)",
  notDeployedEveryWhere:
    "Attention, le formulaire de demande de convention n'est pas encore déployé partout en France.",
  forStartWeNeed: "Pour commencer nous avons besoin de",
  yourAgencyLabel: "Votre structure d'accompagnement",
  conventionAlreadySigned: "Vous avez déjà signé cette convention.",
  conventionReadyToBeSigned:
    "Cette demande d'immersion est prête à être signée.",
  conventionToSignOrAskForChanges:
    "Veuillez la signer ou la renvoyer pour modification.",
  conventionNotEditable: "Cette demande d'immersion n'est plus modifiable.",
  beneficiary: {
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom de famille",
    birthdate: "Date de naissance",
    email: {
      label: "E-mail",
      placeholder: "nom@exemple.com",
      description:
        "cela nous permet de vous transmettre la validation de la convention",
    },
    phone: {
      label: "Téléphone",
      placeholder: "0606060607",
      description: "pour qu’on puisse vous contacter à propos de l’immersion",
    },
    isMinorLabel: "La personne qui va faire l'immersion est-elle mineure ?",
  },
  establishment: {
    siret: {
      label: "Indiquez le SIRET de la structure d'accueil",
      placeholder: "362 521 879 00034",
      description:
        "la structure d'accueil, c'est l'entreprise, le commerce, l'association ... où vous allez faire votre immersion",
    },
    subtitle:
      "Les questions suivantes doivent être complétées avec la personne qui vous accueillera pendant votre immersion",
    businessNameLabel:
      "Indiquez le nom (raison sociale) de l'établissement d'accueil",
    establishmentTutor: {
      firstName: {
        label: "Indiquez le prénom du tuteur",
        description: "Ex : Alain",
      },
      lastName: {
        label: "Indiquez le nom du tuteur",
        description: "Ex : Prost",
      },
      job: {
        label: "Indiquez la fonction du tuteur",
        description: "Ex : Pilote automobile",
      },
      email: {
        label: "Indiquez l'e-mail du tuteur",
        placeholder: "nom@exemple.com",
        description: "pour envoyer la validation de la convention",
      },
      phone: {
        label:
          "Indiquez le numéro de téléphone du tuteur ou de la structure d'accueil",
        placeholder: "0606060607",
        description: "pour qu’on puisse vous contacter à propos de l’immersion",
      },
    },
    isEstablishmentTutorIsEstablishmentRepresentative:
      "Est-ce que le tuteur de l'entreprise est le représentant de l'entreprise, signataire de la convention ?",
    establishmentRepresentative: {
      firstName: {
        label: "Indiquez le prénom du représentant de l'entreprise",
        description: "Ex : Alain",
      },
      lastName: {
        label: "Indiquez le nom du représentant de l'entreprise",
        description: "Ex : Prost",
      },
      email: {
        label: "Indiquez l'e-mail du représentant de l'entreprise",
        placeholder: "nom@exemple.com",
        description: "pour envoyer la validation de la convention",
      },
      phone: {
        label:
          "Indiquez le numéro de téléphone du représentant de l'entreprise",
        placeholder: "0606060607",
        description: "pour qu’on puisse vous contacter à propos de l’immersion",
      },
    },
  },
  immersionConditionsCommonFields: {
    dateStartLabel: "Date de début de l'immersion",
    dateEndLabel: "Date de fin de l'immersion",
    workConditions: {
      label:
        "Conditions de travail, propres  au métier observé pendant l’immersion. ",
      description:
        "Ex : transport de marchandises longue distance - pas de retour au domicile pendant 2 jours",
    },
    immersionAddressLabel: "Adresse du lieu où se fera l'immersion",
    individualProtectionLabel:
      "Un équipement de protection individuelle est-il fourni pour l’immersion ?",
    sanitaryPreventionLabel:
      "Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ?",
    sanitaryPreventionDetails: {
      label: "Si oui, précisez-les",
      description: "Ex : fourniture de gel, de masques",
    },
    immersionObjectiveLabel:
      "Objet de la période de mise en situation en milieu professionnel",
    profession: {
      label: "Intitulé du poste / métier observé pendant l'immersion",
      description: "Ex : employé libre service, web développeur, boulanger …",
    },
    immersionActivities: {
      label: "Activités observées / pratiquées pendant l'immersion",
      description: "Ex : mise en rayon, accueil et aide à la clientèle",
    },
    immersionSkills: {
      label: "Compétences/aptitudes observées / évaluées pendant l'immersion",
      description:
        "Ex : communiquer à l'oral, résoudre des problèmes, travailler en équipe",
    },
  },
  emergencyContact: {
    nameLabel: "Prénom et nom de la personne à prévenir en cas d'urgence",
    phone: {
      label: "Téléphone de la personne à prévenir en cas d'urgence",
      placeholder: "0606060607",
    },
  },
  beneficiaryRepresentative: {
    firstNameLabel: "Prénom du représentant légal",
    lastNameLabel: "Nom de famille du représentant légal",
    email: {
      label: "E-mail",
      placeholder: "nom@exemple.com",
      description:
        "cela nous permet de vous transmettre la validation de la convention",
    },
    phone: {
      label: "Téléphone",
      placeholder: "0606060607",
      description: "pour qu’on puisse vous contacter à propos de l’immersion",
    },
  },
  beneficiaryCurrentEmployer: {
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom",
    emailLabel: "E-mail",
    jobLabel: "Fonction",
    phoneLabel: "Téléphone",
    businessNameLabel: "Raison sociale de l'entreprise",
    businessSiretLabel: "Siret",
    hasCurrentEmployerLabel:
      "Le bénéficiaire de l’immersion est-il actuellement salarié(e) d’une autre entreprise (que celle où l’immersion va avoir lieu) ?",
  },
  verification: {
    rejectConvention: "Refuser l'immersion ...",
    modifyConvention: "Renvoyer au bénéficiaire pour modification",
    conventionAlreadyMarkedAsEligible: "Demande déjà validée.",
    markAsEligible: "Marquer la demande comme éligible",
    conventionAlreadyValidated: "Demande déjà validée",
    markAsValidated: "Valider la demande",
  },
};
