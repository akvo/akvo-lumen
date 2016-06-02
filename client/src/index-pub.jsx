import React from 'react';
import { render } from 'react-dom';
import VisualisationPreview from './components/visualisation/VisualisationPreview';
import DashboardViewer from './components/dashboard/DashboardViewer';
import LumenBranding from './components/common/LumenBranding';

require('./styles/reset.global.scss');
require('./styles/style.global.scss');

const rootElement = document.querySelector('#root');
const data = window.LUMEN_DATA;

/*
Uncomment to mock dashboard data
===

const data = {
  dashboard: {"id":"574f167d-016b-4a65-a5b3-0cb3109fef40","title":"Test dashboard 1","created":1464800893426,"modified":1464800893426,"entities":{"text-1":{"id":"text-1","type":"text","content":"I am a text element that is 5 columns wide"},"text-2":{"id":"text-2","type":"text","content":"I am a text element that is 7 columns wide"},"text-3":{"id":"text-3","type":"text","content":"I am a text element following a blank row"},"text-4":{"id":"text-4","type":"text","content":"I am a text element with 8 blank columns to my left"},"574f15a1-f8a6-46bb-9cfc-be1714c93f2e":{"id":"574f15a1-f8a6-46bb-9cfc-be1714c93f2e","type":"visualisation"},"574f15d1-e93b-4e9a-9f7b-885a5f12ac2d":{"id":"574f15d1-e93b-4e9a-9f7b-885a5f12ac2d","type":"visualisation"},"574f15e9-a4f3-4e75-afe4-c5b00ba47dfc":{"id":"574f15e9-a4f3-4e75-afe4-c5b00ba47dfc","type":"visualisation"},"574f15fe-e53b-44ad-ba95-a4118aa440bb":{"id":"574f15fe-e53b-44ad-ba95-a4118aa440bb","type":"visualisation"}},"layout":{"text-1":{"h":1,"i":"text-1","w":5,"x":0,"y":4,"minW":2,"moved":false},"text-2":{"h":1,"i":"text-2","w":7,"x":5,"y":4,"minW":2,"moved":false},"text-3":{"h":1,"i":"text-3","w":12,"x":0,"y":6,"minW":2,"moved":false},"text-4":{"h":2,"i":"text-4","w":4,"x":8,"y":7,"minW":2,"moved":false},"574f15a1-f8a6-46bb-9cfc-be1714c93f2e":{"h":4,"i":"574f15a1-f8a6-46bb-9cfc-be1714c93f2e","w":6,"x":0,"y":0,"minH":4,"minW":4,"moved":false},"574f15d1-e93b-4e9a-9f7b-885a5f12ac2d":{"h":4,"i":"574f15d1-e93b-4e9a-9f7b-885a5f12ac2d","w":6,"x":6,"y":0,"minH":4,"minW":4,"moved":false},"574f15e9-a4f3-4e75-afe4-c5b00ba47dfc":{"h":4,"i":"574f15e9-a4f3-4e75-afe4-c5b00ba47dfc","w":4,"x":0,"y":9,"minH":4,"minW":4,"moved":false},"574f15fe-e53b-44ad-ba95-a4118aa440bb":{"h":5,"i":"574f15fe-e53b-44ad-ba95-a4118aa440bb","w":7,"x":5,"y":10,"minH":4,"minW":4,"moved":false}},"type":"dashboard","status":"OK"},
  visualisations: {"574f15a1-f8a6-46bb-9cfc-be1714c93f2e":{"id":"574f15a1-f8a6-46bb-9cfc-be1714c93f2e","datasetId":"574f158c-f010-48a1-acca-778a385516a1","name":"map 1","visualisationType":"map","spec":{"minX":null,"datasetColumnX":2,"labelY":null,"datasetColumnY":1,"maxX":null,"labelX":null,"minY":null,"datasetNameColumnX":0,"maxY":null},"created":1464800673108,"modified":1464800673108,"type":"visualisation","status":"OK"},"574f15d1-e93b-4e9a-9f7b-885a5f12ac2d":{"id":"574f15d1-e93b-4e9a-9f7b-885a5f12ac2d","datasetId":"574f157f-24d0-4221-987f-e7dd3c207b39","name":"Pokemon weight","visualisationType":"bar","spec":{"minX":null,"datasetColumnX":4,"labelY":"pokemon weight","datasetColumnY":null,"maxX":null,"labelX":"pokemon name","minY":null,"datasetNameColumnX":1,"maxY":null},"created":1464800721068,"modified":1464800721068,"type":"visualisation","status":"OK"},"574f15e9-a4f3-4e75-afe4-c5b00ba47dfc":{"id":"574f15e9-a4f3-4e75-afe4-c5b00ba47dfc","datasetId":"574f157f-24d0-4221-987f-e7dd3c207b39","name":"Pokemon weight vs height","visualisationType":"scatter","spec":{"minX":null,"datasetColumnX":3,"labelY":"pokemon weight","datasetColumnY":4,"maxX":null,"labelX":"pokemon height","minY":null,"datasetNameColumnX":null,"maxY":null},"created":1464800745743,"modified":1464800745743,"type":"visualisation","status":"OK"},"574f15fe-e53b-44ad-ba95-a4118aa440bb":{"id":"574f15fe-e53b-44ad-ba95-a4118aa440bb","datasetId":"574f157f-24d0-4221-987f-e7dd3c207b39","name":"pokemon base experience","visualisationType":"area","spec":{"minX":null,"datasetColumnX":5,"labelY":null,"datasetColumnY":null,"maxX":null,"labelX":null,"minY":null,"datasetNameColumnX":null,"maxY":null},"created":1464800766908,"modified":1464800766908,"type":"visualisation","status":"OK"}},
  datasets: {"574f158c-f010-48a1-acca-778a385516a1":{"id":"574f158c-f010-48a1-acca-778a385516a1","name":"ten cities","modified":1464800652240,"created":1464800652240,"status":"OK","columns":[{"sort":null,"type":"text","title":"New York","hidden":false,"direction":null,"columnName":"c1"},{"sort":null,"type":"text","title":"40.7128","hidden":false,"direction":null,"columnName":"c2"},{"sort":null,"type":"text","title":"-74.0059","hidden":false,"direction":null,"columnName":"c3"}],"rows":[["London","51.5085300","-0.12574"],["Sydney","-33.865143","151.209900"],["Los Angeles","34.052235","-118.243683"],["Tokyo","35.6895","139.69171"],["Shanghai","31.22222","121.45806"],["Edinburgh","55.953251","-3.188267"],["Amsterdam","52.37403","4.88969"],["New Delhi","28.635308","77.22496"],["Mumbai","19.07283","72.88261"]],"type":"dataset"},"574f157f-24d0-4221-987f-e7dd3c207b39":{"id":"574f157f-24d0-4221-987f-e7dd3c207b39","name":"pokemon","modified":1464800639492,"created":1464800639492,"status":"OK","columns":[{"sort":null,"type":"text","title":"id","hidden":false,"direction":null,"columnName":"c1"},{"sort":null,"type":"text","title":"identifier","hidden":false,"direction":null,"columnName":"c2"},{"sort":null,"type":"text","title":"species_id","hidden":false,"direction":null,"columnName":"c3"},{"sort":null,"type":"text","title":"height","hidden":false,"direction":null,"columnName":"c4"},{"sort":null,"type":"text","title":"weight","hidden":false,"direction":null,"columnName":"c5"},{"sort":null,"type":"text","title":"base_experience","hidden":false,"direction":null,"columnName":"c6"},{"sort":null,"type":"text","title":"order","hidden":false,"direction":null,"columnName":"c7"},{"sort":null,"type":"text","title":"is_default","hidden":false,"direction":null,"columnName":"c8"}],"rows":[["1","bulbasaur","1","7","69","64","1","1"],["2","ivysaur","2","10","130","142","2","1"],["3","venusaur","3","20","1000","236","3","1"],["4","charmander","4","6","85","62","5","1"],["5","charmeleon","5","11","190","142","6","1"],["6","charizard","6","17","905","240","7","1"],["7","squirtle","7","5","90","63","10","1"],["8","wartortle","8","10","225","142","11","1"],["9","blastoise","9","16","855","239","12","1"],["10","caterpie","10","3","29","39","14","1"],["11","metapod","11","7","99","72","15","1"],["12","butterfree","12","11","320","178","16","1"],["13","weedle","13","3","32","39","17","1"],["14","kakuna","14","6","100","72","18","1"],["15","beedrill","15","10","295","178","19","1"],["16","pidgey","16","3","18","50","21","1"],["17","pidgeotto","17","11","300","122","22","1"],["18","pidgeot","18","15","395","216","23","1"],["19","rattata","19","3","35","51","25","1"],["20","raticate","20","7","185","145","26","1"],["21","spearow","21","3","20","52","27","1"],["22","fearow","22","12","380","155","28","1"],["23","ekans","23","20","69","58","29","1"],["24","arbok","24","35","650","153","30","1"],["25","pikachu","25","4","60","112","32","1"],["26","raichu","26","8","300","218","39","1"],["27","sandshrew","27","6","120","60","40","1"],["28","sandslash","28","10","295","158","41","1"],["29","nidoran-f","29","4","70","55","42","1"],["30","nidorina","30","8","200","128","43","1"]],"type":"dataset"}},
};
*/

render(
  <div>
    {data.dashboard ?
      <DashboardViewer
        dashboard={data.dashboard}
        visualisations={data.visualisations}
        datasets={data.datasets}
      />
      :
      <VisualisationPreview
        visualisation={data.visualisation}
        datasets={data.datasets}
      />
    }
    <LumenBranding />
  </div>,
  rootElement
);
