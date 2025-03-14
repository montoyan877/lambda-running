<template>
  <div class="resizable-container" ref="container">
    <div 
      class="panel-top"
      :style="{ height: `${topPanelHeight}%` }"
    >
      <slot name="top"></slot>
    </div>
    
    <div 
      class="resize-handle" 
      ref="handle"
      @mousedown="startResize"
      :class="{ 'resize-active': isResizing }"
    ></div>
    
    <div 
      class="panel-bottom"
      :style="{ height: `${100 - topPanelHeight}%` }"
    >
      <slot name="bottom"></slot>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onBeforeUnmount } from 'vue';

export default defineComponent({
  name: 'ResizablePanelVertical',
  
  props: {
    initialSplit: {
      type: Number,
      default: 50
    },
    minHeight: {
      type: Number,
      default: 20
    },
    maxHeight: {
      type: Number,
      default: 80
    }
  },
  
  setup(props) {
    const container = ref(null);
    const handle = ref(null);
    const topPanelHeight = ref(props.initialSplit);
    const isResizing = ref(false);
    
    // Mouse event handlers
    const startResize = (e) => {
      isResizing.value = true;
      document.addEventListener('mousemove', onResize);
      document.addEventListener('mouseup', stopResize);
      e.preventDefault();
    };
    
    const onResize = (e) => {
      if (!isResizing.value || !container.value) return;
      
      const containerRect = container.value.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const mouseY = e.clientY - containerRect.top;
      
      // Calculate percentage
      let percentage = (mouseY / containerHeight) * 100;
      
      // Clamp to min/max
      percentage = Math.max(props.minHeight, Math.min(props.maxHeight, percentage));
      
      topPanelHeight.value = percentage;
    };
    
    const stopResize = () => {
      isResizing.value = false;
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('mouseup', stopResize);
    };
    
    // Clean up event listeners
    onBeforeUnmount(() => {
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('mouseup', stopResize);
    });
    
    return {
      container,
      handle,
      topPanelHeight,
      isResizing,
      startResize
    };
  }
});
</script>

<style scoped>
.resizable-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.panel-top, .panel-bottom {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.resize-handle {
  width: 100%;
  height: 6px;
  background-color: var(--color-dark-border);
  cursor: row-resize;
  transition: background-color 0.2s;
}

.resize-handle:hover, .resize-handle.resize-active {
  background-color: var(--color-primary-500);
}
</style> 