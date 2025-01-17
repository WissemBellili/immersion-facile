import {
  AddressDto,
  Builder,
  defaultMaxContactsPerWeek,
  FormEstablishmentSource,
  GeoPositionDto,
  NafDto,
  NumberEmployeesRange,
} from "shared";
import {
  DataSource,
  EstablishmentEntity,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { avenueChampsElyseesDto } from "./addressDtos";

export const defaultNafCode = "7820Z";
export const validEstablishmentEntityV2: EstablishmentEntity = {
  siret: "78000403200019",
  name: "Company inside repository",
  address: avenueChampsElyseesDto,
  website: "www.jobs.fr",
  additionalInformation: "",
  customizedName: undefined,
  isCommited: undefined,
  dataSource: "form",
  sourceProvider: "immersion-facile",
  voluntaryToImmersion: true,
  position: { lat: 35, lon: 50 },
  nafDto: { code: defaultNafCode, nomenclature: "NAFRev2" },
  numberEmployeesRange: "10-19",
  updatedAt: new Date("2022-01-05T12:00:00.000"),
  isActive: true,
  isSearchable: true,
  maxContactsPerWeek: defaultMaxContactsPerWeek,
};

export class EstablishmentEntityBuilder
  implements Builder<EstablishmentEntity>
{
  constructor(
    private readonly entity: EstablishmentEntity = validEstablishmentEntityV2,
  ) {}

  withSiret(siret: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, siret });
  }

  withAddress(address: AddressDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, address });
  }
  withWebsite(website: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, website });
  }
  withPosition(position: GeoPositionDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, position });
  }
  withName(name: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, name });
  }
  withCustomizedName(customizedName: string) {
    return new EstablishmentEntityBuilder({ ...this.entity, customizedName });
  }
  withDataSource(dataSource: DataSource) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      dataSource,
      voluntaryToImmersion: dataSource === "form",
    });
  }

  withNafDto(nafDto: NafDto) {
    return new EstablishmentEntityBuilder({ ...this.entity, nafDto });
  }

  withNumberOfEmployeeRange(numberEmployeesRange: NumberEmployeesRange) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      numberEmployeesRange,
    });
  }

  withIsCommited(isCommited: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isCommited,
    });
  }

  notActive() {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isActive: false,
    });
  }

  withSourceProvider(sourceProvider: FormEstablishmentSource) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      sourceProvider,
    });
  }

  withAdditionalInformation(additionalInformation: string) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      additionalInformation,
    });
  }

  withUpdatedAt(updatedAt: Date) {
    return new EstablishmentEntityBuilder({ ...this.entity, updatedAt });
  }

  withMaxContactsPerWeek(maxContactsPerWeek: number) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      maxContactsPerWeek,
    });
  }

  withIsSearchable(isSearchable: boolean) {
    return new EstablishmentEntityBuilder({
      ...this.entity,
      isSearchable,
    });
  }

  build() {
    return this.entity;
  }
}
