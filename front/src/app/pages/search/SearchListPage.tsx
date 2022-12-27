import { Form, Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import {
  ButtonSearch,
  MainWrapper,
  PageHeader,
  SectionTextEmbed,
  SectionAccordion,
  Select,
} from "react-design-system/immersionFacile";
import { RomeAutocomplete } from "src/app/components/forms/autocomplete/RomeAutocomplete";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { useFullSearchUseCase } from "src/app/hooks/search.hooks";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import "./SearchListPage.scss";
import { SearchListResults } from "src/app/components/search/SearchListResults";
import { addressDtoToString, SearchSortedBy } from "shared";
// import { SearchSortedBy } from "shared";
import {
  SearchPageParams,
  SearchStatus,
} from "src/core-logic/domain/search/search.slice";
import { Route } from "type-route";
import { routes } from "src/app/routes/routes";

const radiusOptions = [1, 2, 5, 10, 20, 50, 100];
const sortedByOptions: { value: SearchSortedBy; label: string }[] = [
  { value: "distance", label: "Par proximité" },
  { value: "date", label: "Par date de publication" },
];
export const SearchListPage = ({
  route,
}: {
  route: Route<typeof routes.searchV2>;
}) => {
  const searchStatus = useAppSelector(searchSelectors.searchStatus);
  const searchResults = useAppSelector(searchSelectors.searchResults);
  const searchUseCase = useFullSearchUseCase();
  const searchResultsWrapper = useRef<HTMLDivElement>(null);
  const initialValues = {
    latitude: 0,
    longitude: 0,
    distance_km: 10,
    address: "",
    sortedBy: undefined,
  };
  const [formikValues, setFormikValues] =
    useState<SearchPageParams>(initialValues);

  const availableForSearchRequest = (
    searchStatus: SearchStatus,
    values: SearchPageParams,
  ): boolean => {
    const check =
      searchStatus !== "initialFetch" &&
      searchStatus !== "extraFetch" &&
      values.longitude &&
      values.latitude &&
      values.longitude !== 0 &&
      values.latitude !== 0;
    return !!check;
  };

  useEffect(() => {
    if (
      route &&
      availableForSearchRequest(searchStatus, route.params as SearchPageParams)
    ) {
      setFormikValues(route.params as SearchPageParams);
      searchUseCase(route.params as SearchPageParams);
    }
  }, []);

  return (
    <HeaderFooterLayout>
      <MainWrapper vSpacing={0} layout="fullscreen">
        <PageHeader title="Je trouve une entreprise pour réaliser mon immersion professionnelle">
          <Formik<SearchPageParams>
            initialValues={formikValues}
            onSubmit={searchUseCase}
            enableReinitialize={availableForSearchRequest(
              searchStatus,
              route.params as SearchPageParams,
            )}
          >
            {({ setFieldValue, values }) => (
              <Form
                className={
                  "search-page__form search-page__form--v2 fr-grid-row fr-grid-row--gutters"
                }
              >
                <div
                  className={
                    "search-page__form-input-wrapper fr-col-12 fr-col-lg-4"
                  }
                >
                  <RomeAutocomplete
                    title="Je recherche un métier"
                    setFormValue={(newValue) => {
                      setFieldValue("romeLabel", newValue.romeLabel);
                      setFieldValue("rome", newValue.romeCode);
                      setFormikValues({
                        ...values,
                        romeLabel: newValue.romeLabel,
                        rome: newValue.romeCode,
                      });
                    }}
                    id={"im-search-page__rome-autocomplete"}
                    initialValue={{
                      romeLabel: values.romeLabel ?? "",
                      romeCode: values.rome ?? "",
                    }}
                    placeholder={"Ex : boulangère, infirmier"}
                  />
                </div>
                <div
                  className={
                    "search-page__form-input-wrapper fr-col-12 fr-col-lg-4"
                  }
                >
                  <AddressAutocomplete
                    label="Mon périmètre de recherche"
                    initialSearchTerm={values.address}
                    setFormValue={({ position, address }) => {
                      setFieldValue("latitude", position.lat);
                      setFieldValue("longitude", position.lon);
                      setFieldValue("address", addressDtoToString(address));
                      setFormikValues(values);
                      setFormikValues({
                        ...values,
                        latitude: position.lat,
                        longitude: position.lon,
                        address: addressDtoToString(address),
                      });
                    }}
                    id="im-search-page__address-autocomplete"
                    placeholder={"Ex : Bordeaux 33000"}
                  />
                </div>
                <div
                  className={
                    "search-page__form-input-wrapper fr-col-12 fr-col-lg-2"
                  }
                >
                  <Select
                    label="Distance maximum"
                    onChange={(event: React.ChangeEvent) => {
                      //_newValue: string, selectedIndex: number
                      const selectedIndex =
                        (event.currentTarget as HTMLSelectElement)
                          .selectedIndex - 1;
                      setFieldValue(
                        "distance_km",
                        radiusOptions[selectedIndex],
                      );
                      setFormikValues({
                        ...values,
                        distance_km: radiusOptions[selectedIndex],
                      });
                    }}
                    options={[
                      {
                        label: "Distance",
                        value: undefined,
                        disabled: true,
                        selected: true,
                      },
                      ...radiusOptions.map((n, index) => ({
                        label: `${n} km`,
                        value: index,
                        selected: n === initialValues.distance_km,
                      })),
                    ]}
                    id="im-search-page__distance-dropdown"
                  />
                </div>

                <div
                  className={
                    "search-page__form-input-wrapper fr-col-12 fr-col-lg-2"
                  }
                >
                  <ButtonSearch
                    disabled={!availableForSearchRequest(searchStatus, values)}
                    type="submit"
                    id={"im-search__submit-search"}
                  >
                    Rechercher
                  </ButtonSearch>
                </div>
              </Form>
            )}
          </Formik>
        </PageHeader>
        <div className="fr-pt-6w" ref={searchResultsWrapper}>
          {searchStatus === "ok" && (
            <>
              <div className="fr-container">
                <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w fr-grid-row--bottom">
                  <div className="fr-col-12 fr-col-md-8">
                    <fieldset className="fr-fieldset fr-fieldset--inline fr-mb-0">
                      <legend
                        className="fr-fieldset__legend fr-text--regular"
                        id="radio-inline-legend"
                      >
                        Trier les résultats :
                      </legend>
                      <div className="fr-fieldset__content">
                        {sortedByOptions.map((option, index) => (
                          <div
                            className="fr-radio-group"
                            key={`search-sort-option-${index}`}
                          >
                            <input
                              type="radio"
                              id={`search-sort-option-${index}`}
                              name="search-sort-option"
                              value={option.value}
                              defaultChecked={
                                formikValues.sortedBy === option.value
                              }
                              checked={formikValues.sortedBy === option.value}
                              onChange={(_event) => {
                                const selectedIndex = index;
                                const newFormikValues = {
                                  ...formikValues,
                                  sortedBy:
                                    sortedByOptions[selectedIndex]?.value,
                                };
                                setFormikValues(newFormikValues);
                                searchUseCase(newFormikValues);
                              }}
                            />
                            <label
                              className="fr-label"
                              htmlFor={`search-sort-option-${index}`}
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                  <div className="fr-col-12 fr-col-md-4 fr-grid-row fr-grid-row--right">
                    {searchStatus === "ok" && (
                      <span className="fr-h5">
                        <strong>{searchResults.length}</strong> résultats
                        trouvés
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <SearchListResults />
            </>
          )}
          {searchStatus === "extraFetch" ||
            (searchStatus === "initialFetch" && (
              <div className="fr-container fr-mb-4w">
                <span>Chargement...</span>
              </div>
            ))}

          <SectionAccordion />
          <SectionTextEmbed
            videoUrl=" https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise.mp4"
            videoPosterUrl="https://immersion.cellar-c2.services.clever-cloud.com/video_immersion_en_entreprise_poster.webp"
          />
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
