<script lang="ts">
import { defineComponent } from "vue";
import Color from "../inputs/Color.vue";
import ToggleButton from "../inputs/ToggleButton.vue";
import Fieldset from "../inputs/Fieldset.vue";
import ColorSample from "../global/ColorSample.vue";
import Space from "../global/Space.vue";
import GradientBlock from "./GradientBlock.vue";
import fontcolors from "../../constants/fontcolors";

export default defineComponent({
  components: {
    ToggleButton, ColorSample, Color, Space, Fieldset, GradientBlock,
  },
  props: {
    modelValue: { type: String, required: true },
    gradient: { type: Array, required: true },
    showDetails: { type: Boolean, required: true },
    gradientSx: { type: Number, required: true },
    gradientSy: { type: Number, required: true },
    gradientEx: { type: Number, required: true },
    gradientEy: { type: Number, required: true },
    gradientMarker: { type: Boolean, required: true },
  },
  emits: [
    "update:modelValue", "update:gradient", "update:gradientSx", "update:gradientSy", "update:gradientEx", "update:gradientEy", "update:gradientMarker",
  ],
  data() {
    return {
      fontcolors,
    };
  },
});
</script>

<template>
  <Fieldset label="色">
    <Space vertical full>
      <Space v-if="!showDetails" small vertical>
        <Space v-for="row in fontcolors" :key="row[0]" small>
          <ToggleButton
              v-for="color in row"
              :key="color"
              size="smallIcon"
              name="文字色"
              :model-value="modelValue"
              :value="color"
              @update:model-value="$emit('update:modelValue', $event)">
            <ColorSample :color="color" />
          </ToggleButton>
        </Space>
      </Space>
      <Color
          v-else
          block
          name="文字色"
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)" />
      <GradientBlock
          :show-details="showDetails"
          :model-value="gradient"
          :gradient-sx="gradientSx"
          :gradient-sy="gradientSy"
          :gradient-ex="gradientEx"
          :gradient-ey="gradientEy"
          :base-color="modelValue"
          @update:model-value="$emit('update:gradient', $event)"
          @update:gradientSx="$emit('update:gradientSx', $event)"
          @update:gradientSy="$emit('update:gradientSy', $event)"
          @update:gradientEx="$emit('update:gradientEx', $event)"
          @update:gradientEy="$emit('update:gradientEy', $event)"
          @update:gradientMarker="$emit('update:gradientMarker', $event)" />
    </Space>
  </Fieldset>
</template>
