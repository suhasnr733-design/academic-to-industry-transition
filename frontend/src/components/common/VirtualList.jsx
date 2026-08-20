// frontend/src/components/common/VirtualList.jsx

import React, { useRef, useState, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { motion } from 'framer-motion'

export const VirtualList = ({ items = [], itemHeight = 60, height = 400, width = '100%', renderItem, onLoadMore }) => {
  const [isLoading, setIsLoading] = useState(false)
  const listRef = useRef()
  
  const handleItemsRendered = useCallback(({ visibleStopIndex }) => {
    if (visibleStopIndex >= items.length - 5 && onLoadMore && !isLoading) {
      setIsLoading(true)
      onLoadMore().finally(() => setIsLoading(false))
    }
  }, [items.length, onLoadMore, isLoading])
  
  const Row = ({ index, style }) => {
    const item = items[index]
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    )
  }
  
  return (
    <div className="relative">
      <List
        ref={listRef}
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight}
        onItemsRendered={handleItemsRendered}
      >
        {Row}
      </List>
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="spinner h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export const InfiniteScroll = ({ children, onLoadMore, hasMore, loader }) => {
  const [isLoading, setIsLoading] = useState(false)
  const observerRef = useRef()
  const lastElementRef = useCallback(node => {
    if (isLoading) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setIsLoading(true)
        onLoadMore().finally(() => setIsLoading(false))
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [isLoading, hasMore, onLoadMore])
  
  return (
    <>
      {children}
      {hasMore && (
        <div ref={lastElementRef} className="flex justify-center py-4">
          {loader || <div className="spinner h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
        </div>
      )}
    </>
  )
}

export default VirtualList
