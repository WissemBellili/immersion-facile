import { ArgTypes, ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { modalPrefix } from ".";
import { ModalDialog, ModalDialogProperties } from "./Modal";
import { ModalContent } from "./ModalContent";
import { ModalFooter } from "./ModalFooter";
import { ModalTitle } from "./ModalTitle";

const Component = ModalDialog;
const argTypes: Partial<ArgTypes<ModalDialogProperties>> | undefined = {};

export default {
  title: `${modalPrefix}${Component.name}`,
  component: Component,
  argTypes,
} as ComponentMeta<typeof Component>;

const componentStory: ComponentStory<typeof Component> = (args) => (
  <Component {...args} />
);

export const Default = componentStory.bind({});
Default.args = {
  children: [
    <ModalTitle key="modal-title">
      <span>Exemple de titre</span>
    </ModalTitle>,
    <ModalContent key="modal-content">
      <div>Exemple de contenu</div>
    </ModalContent>,
    <ModalFooter key="modal-footer">
      <span>Exemple de footer</span>
    </ModalFooter>,
  ],
  isOpen: true,
  canClose: true,
  size: "md",
};
