<template>
  <div class="resizable-container" ref="container">
    <div 
      class="panel-left"
      :style="{ width: `${leftPanelWidth}%` }"
    >
      <slot name="left"></slot>
    </div>
    
    <div 
      class="resize-handle" 
      ref="handle"
      @mousedown="startResize"
      :class="{ 'resize-active': isResizing }"
    ></div>
    
    <div 
      class="panel-right"
      :style="{ width: `${100 - leftPanelWidth}%` }"
    >
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';

export default defineComponent({
  name: 'ResizablePanel',
  
  props: {
    initialSplit: {
      type: Number,
      default: 50
    },
    minWidth: {
      type: Number,
      default: 20
    },
    maxWidth: {
      type: Number,
      default: 80
    }
  },
  
  setup(props) {
    const container = ref(null);
    const handle = ref(null);
    const leftPanelWidth = ref(props.initialSplit);
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
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      
      // Calculate percentage
      let percentage = (mouseX / containerWidth) * 100;
      
      // Clamp to min/max
      percentage = Math.max(props.minWidth, Math.min(props.maxWidth, percentage));
      
      leftPanelWidth.value = percentage;
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
      leftPanelWidth,
      isResizing,
      startResize
    };
  }
});
</script>

<style scoped>
.resizable-container {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.panel-left, .panel-right {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.resize-handle {
  width: 6px;
  height: 100%;
  background-color: var(--color-dark-border);
  cursor: col-resize;
  transition: background-color 0.2s;
}

.resize-handle:hover, .resize-handle.resize-active {
  background-color: var(--color-primary-500);
}
</style> 