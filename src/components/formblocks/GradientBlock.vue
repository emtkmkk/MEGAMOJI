<script lang="ts">
import { defineComponent, PropType } from "vue";
import Checkbox from "../inputs/Checkbox.vue";
import Gradient from "../inputs/Gradient.vue";
import NumberInput from "../inputs/Number.vue";
import Space from "../global/Space.vue";
import { ColorStop } from "../../types";

export default defineComponent({
  components: {
    Checkbox, Gradient, Space, Number: NumberInput,
  },
  props: {
    modelValue: { type: Array as PropType<ColorStop[]>, required: true },
    gradientSx: { type: Number, required: true },
    gradientSy: { type: Number, required: true },
    gradientEx: { type: Number, required: true },
    gradientEy: { type: Number, required: true },
    gradientMarker: { type: Boolean, required: true },
    baseColor: { type: String, required: true },
    showDetails: { type: Boolean, required: true },
  },
  emits: [
    "update:modelValue", "update:gradientSx", "update:gradientSy", "update:gradientEx", "update:gradientEy", "update:gradientMarker"
  ],
  methods: {
    initializeGradient(): void {
      this.$emit("update:modelValue", [
        { color: "lighter", pos: 0 },
        { color: "lighter", pos: 50 },
        { color: "darker", pos: 63 },
        { color: "lighter", pos: 100 },
      ]);
    },
    toggle(): void {
      if (this.modelValue.length === 0) {
        this.initializeGradient();
      } else {
        this.$emit("update:modelValue", []);
        this.$emit("update:gradientSx", 0);
        this.$emit("update:gradientSy", 0);
        this.$emit("update:gradientEx", 0);
        this.$emit("update:gradientEy", 0);
        this.$emit("update:gradientMarker", false);
      }
    },
    update(ix: number, value: ColorStop): void {
      this.$emit("update:modelValue", this.modelValue.map((origVal, i) => (
        i === ix ? value : origVal
      )));
    },
    remove(ix: number): void {
      this.$emit("update:modelValue", this.modelValue.filter((_, i) => i !== ix));
    },
    add(): void {
      this.$emit("update:modelValue", [
        ...this.modelValue,
        { color: "identical", pos: 50 },
      ]);
    },
    clearGradient(): void {
      this.$emit("update:modelValue", []);
      this.$emit("update:gradientSx", 0);
      this.$emit("update:gradientSy", 0);
      this.$emit("update:gradientEx", 0);
      this.$emit("update:gradientEy", 0);
      this.$emit("update:gradientMarker", false);
    },
  },
});
</script>

<template>
  <Space vertical full>
    <Gradient
        v-if="showDetails && modelValue.length > 0"
        :model-value="modelValue"
        :base-color="baseColor"
        @update:model-value="$emit('update:modelValue', $event)" />
    <div>
      <Number
          v-if="showDetails && modelValue.length > 0"
          :model-value="gradientSx"
          block
          :min="-200"
          :max="200"
          :step="1"
          @update:model-value="$emit('update:gradientSx', $event)" />
      <Number
          v-if="showDetails && modelValue.length > 0"
          :model-value="gradientSy"
          block
          :min="-200"
          :max="200"
          :step="1"
          @update:model-value="$emit('update:gradientSy', $event)" />
    </div>
    <div>
      <Number
          v-if="showDetails && modelValue.length > 0"
          :model-value="gradientEx"
          block
          :min="-200"
          :max="200"
          :step="1"
          @update:model-value="$emit('update:gradientEx', $event)" />
      <Number
          v-if="showDetails && modelValue.length > 0"
          :model-value="gradientEy"
          block
          :min="-200"
          :max="200"
          :step="1"
          @update:model-value="$emit('update:gradientEy', $event)" />
    </div>
    <Checkbox
        name="マーカー表示"
        :model-value="gradientMarker"
        @update:model-value="$emit('update:gradientMarker', $event)">
      {{ "マーカー表示" }}
    </Checkbox>
    <Checkbox
        name="グラデーション"
        :model-value="modelValue.length > 0"
        @update:model-value="toggle">
      {{ "グラデーション" }}
    </Checkbox>
  </Space>
</template>
