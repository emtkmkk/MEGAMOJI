<script lang="ts">
import { defineComponent, PropType } from "vue";
import Button from "../inputs/Button.vue";
import ToggleButton from "../inputs/ToggleButton.vue";
import Fieldset from "../inputs/Fieldset.vue";
import ColorSample from "../global/ColorSample.vue";
import Space from "../global/Space.vue";
import OutlineItemBlock from "./OutlineItemBlock.vue";
import { absColor } from "../../utils/color";

type OutlineOption = { value: string, absColor: string };

export default defineComponent({
  components: {
    ToggleButton, ColorSample, OutlineItemBlock, Fieldset, Button, Space,
  },
  props: {
    modelValue: { type: Array as PropType<string[]>, required: true },
    baseColor: { type: String, required: true },
    showDetails: { type: Boolean, required: true },
  },
  emits: [
    "update:modelValue",
  ],
  data() {
    return {
      firstRowSelection: [] as string[], // 1段目の選択
      secondRowSelection: [] as string[], // 2段目の選択
      isUpdatingSelections: false,
    };
  },
  computed: {
    options(): OutlineOption[] {
      return [
        { value: "recommend", absColor: absColor("recommend", this.baseColor) },
        { value: "recommend2", absColor: absColor("recommend2", this.baseColor) },
        { value: "darker", absColor: absColor("darker", this.baseColor) },
        { value: "identical", absColor: absColor("identical", this.baseColor) },
        { value: "lighter", absColor: absColor("lighter", this.baseColor) },
        { value: "lighterer", absColor: absColor("lighterer", this.baseColor) },
        { value: "recommendR", absColor: absColor("recommendR", this.baseColor) },
      ];
    },
    absColors(): string[] {
      return this.modelValue.map((color) => absColor(color, this.baseColor));
    },
  },
  watch: {
    modelValue: {
      handler(newModelValue: string[]) {
        if (!this.isUpdatingSelections) {
          this.updateSelections(newModelValue);
        }
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    updateSelections(newModelValue: string[]): void {
      // 選択をリセット
      this.firstRowSelection = [];
      this.secondRowSelection = [];

      // 新しい値を割り当てる
      newModelValue.forEach((value) => {
        if (!this.firstRowSelection.includes(value)) {
          this.firstRowSelection.push(value);
        } else {
          this.secondRowSelection.push(value);
        }
      });
    },
    updateFirstRowSelection(value: string[]): void {
      this.isUpdatingSelections = true;
      this.firstRowSelection = value;
      this.updateMergedSelection();
    },
    updateSecondRowSelection(value: string[]): void {
      this.isUpdatingSelections = true;
      this.secondRowSelection = value;
      this.updateMergedSelection();
    },
    updateMergedSelection(): void {
      const newSelection = [...this.firstRowSelection, ...this.secondRowSelection];
      this.$emit("update:modelValue", newSelection);
      this.isUpdatingSelections = false;
    },
    update(ix: number, value: string): void {
      const newModelValue = this.modelValue.map((origVal, i) => (
        ix === i ? value : origVal
      ));
      this.$emit("update:modelValue", newModelValue);
    },
    add(): void {
      this.$emit("update:modelValue", [...this.modelValue, this.modelValue?.[0] ?? "identical"]);
    },
    remove(ix: number): void {
      this.$emit("update:modelValue", this.modelValue.filter((_, i) => i !== ix));
    },
  },
});
</script>

<template>
  <Fieldset v-if="!showDetails" label="アウトライン">
    <Space vertical small>
      <Space small>
        <ToggleButton
            v-for="option in options"
            :key="option.value + '-1'"
            name="アウトライン"
            :model-value="firstRowSelection"
            size="smallIcon"
            :value="option.value"
            @update:model-value="updateFirstRowSelection">
          <ColorSample :color="option.absColor" />
        </ToggleButton>
      </Space>
      <Space small>
        <ToggleButton
            v-for="option in options"
            :key="option.value + '-2'"
            name="アウトライン"
            :model-value="secondRowSelection"
            size="smallIcon"
            :value="option.value"
            @update:model-value="updateSecondRowSelection">
          <ColorSample :color="option.absColor" />
        </ToggleButton>
      </Space>
    </Space>
  </Fieldset>
  <Fieldset v-else label="アウトライン">
    <Space vertical full>
      <OutlineItemBlock
          v-for="(color, ix) in modelValue"
          :key="ix"
          :model-value="absColors[ix]"
          @update:model-value="update(ix, $event)"
          @remove="remove(ix)" />
      <Button type="dashed" name="アウトライン (追加)" block @click="add">
        + アウトラインを追加
      </Button>
    </Space>
  </Fieldset>
</template>
