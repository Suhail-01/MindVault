'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { DashboardLayout } from '@/components/DashboardLayout';
import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

export default function GraphView() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'saved_items'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (items.length === 0 || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const nodes = items.map(item => ({
      id: item.id,
      title: item.title,
      tags: item.ai_tags || [],
      type: item.type
    }));

    const links: any[] = [];
    // Create links between items with shared tags
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const sharedTags = nodes[i].tags.filter((tag: string) => nodes[j].tags.includes(tag));
        if (sharedTags.length > 0) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: sharedTags.length
          });
        }
      }
    }

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    const link = g.append('g')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value) * 2);

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event, d: any) => {
        router.push(`/item?id=${d.id}`);
      });

    node.append('circle')
      .attr('r', 8)
      .attr('fill', '#4F46E5')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('class', 'cursor-pointer hover:fill-indigo-700 transition-colors');

    node.append('text')
      .attr('x', 12)
      .attr('y', 4)
      .text((d: any) => d.title)
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', '#4B5563')
      .attr('class', 'pointer-events-none select-none')
      .clone(true).lower()
      .attr('fill', 'none')
      .attr('stroke', 'white')
      .attr('stroke-width', 3);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [items, router]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Knowledge Graph</h1>
          <p className="text-gray-500">Visualize connections between your ideas based on shared tags.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 bg-[#F9F9F8] rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[calc(100vh-250px)] bg-[#F9F9F8] rounded-[32px] border border-gray-100 overflow-hidden shadow-inner"
      >
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Controls */}
        <div className="absolute bottom-8 right-8 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100">
            <ZoomIn className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100">
            <ZoomOut className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100">
            <Maximize2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
            No items to visualize yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
