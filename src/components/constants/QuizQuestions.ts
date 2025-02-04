// Define the Question interface
export interface Question {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }
  
  // Grouped questions by categories, translated into en, es, and ja
  export const categorizedQuestions: Record<string, Record<string, Question[]>> = {
    en: {
      "Game Rules & Strategy": [
        {
          question: "What is the objective of baseball?",
          options: [
            "To run the bases and score more runs than the opponent.",
            "To hit as many home runs as possible.",
            "To avoid being tagged out.",
            "To pitch the ball past the batter."
          ],
          correctAnswer: 0,
          explanation: "The main objective is to score runs by advancing around the bases."
        },
        {
          question: "What does 'sacrifice fly' mean?",
          options: [
            "A hit where the batter advances to second base.",
            "A fly ball that allows a base runner to score.",
            "A ball that lands in foul territory.",
            "A defensive play to get an out at home plate."
          ],
          correctAnswer: 1,
          explanation: "A sacrifice fly is a strategic move where the batter allows a runner to score."
        },
        {
          question: "What does 'ERA' stand for in baseball statistics?",
          options: [
            "Earned Run Average",
            "Error Rate Average",
            "Extra Run Average",
            "Effective Running Average"
          ],
          correctAnswer: 0,
          explanation: "ERA stands for Earned Run Average, which is a measure of a pitcher's effectiveness."
        },
        {
            question: "What is a 'double play'?",
            options: [
            "When a batter hits a double.",
            "When two offensive players are put out on the same play.",
            "When a runner scores two runs on a single hit.",
            "When a pitcher throws two strikes in a row.",
            ],
            correctAnswer: 1,
            explanation:
            "A double play is a defensive play where two offensive players are put out as a result of one continuous action.",
        },
        {
            question: "What is the 'infield fly rule'?",
            options: [
            "A rule that applies when a fly ball is hit to the outfield.",
            "A rule that prevents the defense from intentionally dropping an easy catch to get a double or triple play.",
            "A rule that allows the batter to advance to first base on a dropped third strike.",
            "A rule that governs how far infielders can play from their bases.",
            ],
            correctAnswer: 1,
            explanation:
            "The infield fly rule prevents the defense from intentionally dropping a pop-up with runners on base to unfairly get multiple outs.",
        },
        {
            question: "What does it mean when a batter 'grounds out'?",
            options: [
            "The batter hits a ground ball and is thrown out at first base.",
            "The batter hits a fly ball that is caught by an outfielder.",
            "The batter is hit by a pitch.",
            "The batter strikes out swinging.",
            ],
            correctAnswer: 0,
            explanation:
            "A ground out occurs when the batter hits the ball on the ground, and a fielder gets the ball to first base before the batter-runner arrives.",
        },
        {
            question: "When is a 'balk' called in baseball?",
            options: [
            "When a runner leaves a base too early on a steal attempt.",
            "When a pitcher makes an illegal motion on the mound that may deceive a runner.",
            "When a batter steps out of the batter's box during an at-bat.",
            "When a fielder interferes with a runner.",
            ],
            correctAnswer: 1,
            explanation:
            "A balk is called when a pitcher makes an illegal movement on the mound, typically intended to deceive a base runner. This results in all runners advancing one base.",
        },
        {
            question: "What is a 'full count'?",
            options: [
            "When the count is 3 balls and 2 strikes.",
            "When the bases are loaded.",
            "When the score is tied in the 9th inning.",
            "When a batter has hit a home run.",
            ],
            correctAnswer: 0,
            explanation:
            "A full count is when the batter has three balls and two strikes. The next pitch will either result in a walk, a strikeout, or the ball being put into play.",
        },
        {
            question: "What does it mean to 'tag up'?",
            options: [
            "To touch a base with your hand before advancing on a caught fly ball.",
            "To call a timeout.",
            "To hit a sacrifice fly.",
            "To be hit by a pitch.",
            ],
            correctAnswer: 0,
            explanation:
            "Tagging up is when a base runner waits on a base until a fly ball is caught, after which they are allowed to try and advance to the next base.",
        },
        {
            question: "What is a 'force out'?",
            options: [
            "When a runner is forced to advance to the next base because the batter becomes a runner.",
            "When a pitcher throws four balls.",
            "When a batter is called out on strikes.",
            "When a runner is tagged out while not on a base.",
            ],
            correctAnswer: 0,
            explanation:
            "A force out occurs when a runner is forced to advance to the next base because the batter becomes a runner and the defense gets the ball to that base before the runner.",
        },
      ],
      "Player Achievements": [
        {
          question: "Who is the youngest player to achieve a 30-30 season?",
          options: [
            "Julio Rodríguez",
            "Alex Rodriguez",
            "Ronald Acuña Jr.",
            "Mike Trout"
          ],
          correctAnswer: 3,
          explanation: "Mike Trout achieved a 30-30 season in 2012 at the age of 20."
        },
        {
          question: "Who holds the record for most consecutive stolen bases without getting caught?",
          options: [
            "Rickey Henderson",
            "Vince Coleman",
            "Lou Brock",
            "Tim Raines"
          ],
          correctAnswer: 1,
          explanation: "Vince Coleman holds the record with 50 consecutive stolen bases across the 1989-90 seasons."
        },
        {
          question: "Who holds the record for most career home runs in MLB history?",
          options: [
            "Babe Ruth",
            "Hank Aaron",
            "Barry Bonds",
            "Willie Mays"
          ],
          correctAnswer: 2,
          explanation: "Barry Bonds holds the record for most career home runs with 762."
        },
        {
            question: "Who is the only player to hit two grand slams in the same inning?",
            options: [
                "Fernando Tatís Sr.",
                "Babe Ruth",
                "Alex Rodriguez",
                "Jim Northrup"
            ],
            correctAnswer: 0,
            explanation: "Fernando Tatís Sr. achieved this incredible feat on April 23, 1999, while playing for the St. Louis Cardinals."
        },
        {
            question: "Which pitcher has the most career strikeouts in MLB history?",
            options: [
                "Randy Johnson",
                "Nolan Ryan",
                "Roger Clemens",
                "Greg Maddux"
            ],
            correctAnswer: 1,
            explanation: "Nolan Ryan holds the record with an astounding 5,714 career strikeouts."
        },
        {
            question: "Who was the last player to hit .400 in a season?",
            options: [
                "Ted Williams",
                "Tony Gwynn",
                "George Brett",
                "Rod Carew"
            ],
            correctAnswer: 0,
            explanation: "Ted Williams hit .406 in 1941, making him the last player to achieve a .400 batting average in a single season."
        },
        {
            question: "Who holds the record for most Gold Glove Awards?",
            options: [
                "Brooks Robinson",
                "Ozzie Smith",
                "Roberto Clemente",
                "Greg Maddux"
            ],
            correctAnswer: 3,
            explanation: "Pitcher Greg Maddux holds the record with 18 Gold Glove Awards."
        },
        {
            question: "Who is the only player to win MVP awards in both the American League and National League?",
            options: [
                "Frank Robinson",
                "Barry Bonds",
                "Hank Aaron",
                "Alex Rodriguez"
            ],
            correctAnswer: 0,
            explanation: "Frank Robinson won the MVP in the NL in 1961 (Reds) and in the AL in 1966 (Orioles)."
        },
        {
            question: "Who holds the record for the longest hitting streak in MLB history?",
            options: [
                "Joe DiMaggio",
                "Pete Rose",
                "Ty Cobb",
                "Paul Molitor"
            ],
            correctAnswer: 0,
            explanation: "Joe DiMaggio's incredible 56-game hitting streak in 1941 is the longest in MLB history."
        },
        {
            question: "Which pitcher has won the most Cy Young Awards?",
            options: [
                "Randy Johnson",
                "Greg Maddux",
                "Roger Clemens",
                "Steve Carlton"
            ],
            correctAnswer: 2,
            explanation: "Roger Clemens has won 7 Cy Young Awards, the most of any pitcher."
        },
         {
            question: "Who is the only player to have hit 60 or more home runs in a single season three times?",
            options: [
                "Babe Ruth",
                "Sammy Sosa",
                "Mark McGwire",
                "Barry Bonds"
            ],
            correctAnswer: 1,
            explanation: "Sammy Sosa hit 60+ home runs in 1998, 1999, and 2001."
        },
        {
            question: "Who is the only player to win the batting title in both the American League and National League?",
            options: [
                "DJ LeMahieu",
                "Ty Cobb",
                "Ed Delahanty",
                "Rogers Hornsby"
            ],
            correctAnswer: 2,
            explanation: "Ed Delahanty won the batting title in the NL in 1899 (Phillies) and the AL in 1902 (Senators)."
        }
      ]
    },
    es: {
      "Game Rules & Strategy": [
        {
          question: "¿Cuál es el objetivo del béisbol?",
          options: [
            "Correr las bases y anotar más carreras que el oponente.",
            "Conectar la mayor cantidad de jonrones posible.",
            "Evitar ser eliminado.",
            "Lanzar la pelota más allá del bateador."
          ],
          correctAnswer: 0,
          explanation: "El objetivo principal es anotar carreras avanzando por las bases."
        },
        {
          question: "¿Qué significa 'sacrifice fly'?",
          options: [
            "Un golpe donde el bateador avanza a segunda base.",
            "Un elevado que permite anotar a un corredor.",
            "Una pelota que cae en territorio de foul.",
            "Una jugada defensiva para eliminar en el home."
          ],
          correctAnswer: 1,
          explanation: "Un elevado de sacrificio permite que un corredor anote."
        },
        {
          question: "¿Qué significa 'ERA' en las estadísticas de béisbol?",
          options: [
            "Promedio de carreras limpias",
            "Promedio de errores",
            "Promedio de carreras extra",
            "Promedio efectivo de carreras"
          ],
          correctAnswer: 0,
          explanation: "ERA significa Promedio de Carreras Limpias, una medida de la efectividad del lanzador."
        },
        {
            question: "¿Cuál es el objetivo del béisbol?",
            options: [
            "Correr las bases y anotar más carreras que el oponente.",
            "Conectar tantos jonrones como sea posible.",
            "Evitar ser puesto out.",
            "Lanzar la bola más allá del bateador."
            ],
            correctAnswer: 0,
            explanation: "El objetivo principal es anotar carreras avanzando alrededor de las bases."
        },
        {
            question: "¿Qué significa 'fly de sacrificio'?",
            options: [
            "Un hit en el que el bateador avanza a segunda base.",
            "Un elevado que permite a un corredor en base anotar.",
            "Una bola que cae en territorio de foul.",
            "Una jugada defensiva para hacer un out en el home plate."
            ],
            correctAnswer: 1,
            explanation: "Un fly de sacrificio es una jugada estratégica en la que el bateador permite que un corredor anote."
        },
        {
            question: "¿Qué significa 'ERA' en las estadísticas de béisbol?",
            options: [
            "Promedio de Carreras Limpias Permitidas",
            "Promedio de Errores",
            "Promedio de Carreras Extras",
            "Promedio de Corridas Efectivas"
            ],
            correctAnswer: 0,
            explanation: "ERA significa Promedio de Carreras Limpias Permitidas, que es una medida de la efectividad de un lanzador."
        },
        {
            question: "¿Qué es un 'doble play'?",
            options: [
            "Cuando un bateador conecta un doble.",
            "Cuando dos jugadores ofensivos son eliminados en la misma jugada.",
            "Cuando un corredor anota dos carreras en un solo hit.",
            "Cuando un lanzador lanza dos strikes seguidos."
            ],
            correctAnswer: 1,
            explanation: "Un doble play es una jugada defensiva en la que dos jugadores ofensivos son eliminados como resultado de una acción continua."
        },
        {
            question: "¿Qué es la regla del 'infield fly'?",
            options: [
            "Una regla que se aplica cuando se batea un elevado al outfield.",
            "Una regla que evita que la defensa deje caer intencionalmente una atrapada fácil para obtener un doble o triple play.",
            "Una regla que permite al bateador avanzar a primera base en un tercer strike que se le ha caido al receptor.",
            "Una regla que rige qué tan lejos pueden jugar los infielders de sus bases."
            ],
            correctAnswer: 1,
            explanation: "La regla del infield fly evita que la defensa deje caer intencionalmente un elevado con corredores en base para obtener injustamente múltiples outs."
        },
        {
            question: "¿Qué significa cuando un bateador batea un 'rodado de out'?",
            options: [
            "El bateador conecta un rodado y es puesto out en primera base.",
            "El bateador conecta un elevado que es atrapado por un jardinero.",
            "El bateador es golpeado por un lanzamiento.",
            "El bateador se poncha tirándole."
            ],
            correctAnswer: 0,
            explanation: "Un rodado de out ocurre cuando el bateador conecta la bola por el suelo y un defensor lleva la bola a primera base antes de que llegue el bateador-corredor."
        },
        {
            question: "¿Cuándo se canta un 'balk' en el béisbol?",
            options: [
            "Cuando un corredor sale de una base demasiado pronto en un intento de robo.",
            "Cuando un lanzador hace un movimiento ilegal en el montículo que puede engañar a un corredor.",
            "Cuando un bateador sale de la caja de bateo durante un turno al bate.",
            "Cuando un defensor interfiere con un corredor."
            ],
            correctAnswer: 1,
            explanation: "Se canta un balk cuando un lanzador hace un movimiento ilegal en el montículo, típicamente con la intención de engañar a un corredor en base. Esto resulta en que todos los corredores avancen una base."
        },
        {
            question: "¿Qué es una 'cuenta completa'?",
            options: [
            "Cuando la cuenta está en 3 bolas y 2 strikes.",
            "Cuando las bases están llenas.",
            "Cuando el juego está empatado en la novena entrada.",
            "Cuando un bateador ha conectado un jonrón."
            ],
            correctAnswer: 0,
            explanation: "Una cuenta completa es cuando el bateador tiene tres bolas y dos strikes. El siguiente lanzamiento resultará en una base por bolas, un ponche o la bola será puesta en juego."
        },
        {
            question: "¿Qué significa 'pisar y correr' (tag up)?",
            options: [
            "Tocar una base con la mano antes de avanzar en un elevado que es atrapado.",
            "Pedir un tiempo fuera.",
            "Batear un elevado de sacrificio.",
            "Ser golpeado por un lanzamiento."
            ],
            correctAnswer: 0,
            explanation: "Pisar y correr (tag up) es cuando un corredor espera en una base hasta que se atrapa un elevado, después de lo cual se le permite intentar avanzar a la siguiente base."
        },
        {
            question: "¿Qué es un 'force out' (out forzado)?",
            options: [
            "Cuando un corredor está obligado a avanzar a la siguiente base porque el bateador se convierte en corredor.",
            "Cuando un lanzador lanza cuatro bolas.",
            "Cuando un bateador es ponchado.",
            "Cuando un corredor es tocado (puesto out) mientras no está en una base."
            ],
            correctAnswer: 0,
            explanation: "Un force out (out forzado) ocurre cuando un corredor está obligado a avanzar a la siguiente base porque el bateador se convierte en corredor y la defensa lleva la bola a esa base antes que el corredor."
        }
      ],
      "Player Achievements": [
        {
          question: "¿Quién es el jugador más joven en lograr una temporada 30-30?",
          options: [
            "Julio Rodríguez",
            "Alex Rodriguez",
            "Ronald Acuña Jr.",
            "Mike Trout"
          ],
          correctAnswer: 3,
          explanation: "Mike Trout logró una temporada 30-30 en 2012 a los 20 años."
        },
        {
          question: "¿Quién tiene el récord de bases robadas consecutivas sin ser eliminado?",
          options: [
            "Rickey Henderson",
            "Vince Coleman",
            "Lou Brock",
            "Tim Raines"
          ],
          correctAnswer: 1,
          explanation: "Vince Coleman tiene el récord con 50 bases consecutivas entre 1989-90."
        },
        {
          question: "¿Quién tiene el récord de más jonrones en la historia de la MLB?",
          options: [
            "Babe Ruth",
            "Hank Aaron",
            "Barry Bonds",
            "Willie Mays"
          ],
          correctAnswer: 2,
          explanation: "Barry Bonds tiene el récord de jonrones con 762."
        },
        {
            question: "¿Quién es el jugador más joven en lograr una temporada 30-30?",
            options: [
              "Julio Rodríguez",
              "Alex Rodríguez",
              "Ronald Acuña Jr.",
              "Mike Trout"
            ],
            correctAnswer: 3,
            explanation: "Mike Trout logró una temporada 30-30 en 2012 a la edad de 20 años."
          },
          {
            question: "¿Quién tiene el récord de más bases robadas consecutivas sin ser atrapado?",
            options: [
              "Rickey Henderson",
              "Vince Coleman",
              "Lou Brock",
              "Tim Raines"
            ],
            correctAnswer: 1,
            explanation: "Vince Coleman tiene el récord con 50 bases robadas consecutivas entre las temporadas de 1989 y 1990."
          },
          {
            question: "¿Quién tiene el récord de más jonrones en la historia de la MLB?",
            options: [
              "Babe Ruth",
              "Hank Aaron",
              "Barry Bonds",
              "Willie Mays"
            ],
            correctAnswer: 2,
            explanation: "Barry Bonds tiene el récord de más jonrones en su carrera con 762."
          },
          {
            question: "¿Quién es el único jugador en conectar dos grand slams en la misma entrada?",
            options: [
                "Fernando Tatís Sr.",
                "Babe Ruth",
                "Alex Rodriguez",
                "Jim Northrup"
            ],
            correctAnswer: 0,
            explanation: "Fernando Tatís Sr. logró esta increíble hazaña el 23 de abril de 1999, mientras jugaba para los St. Louis Cardinals."
          },
          {
            question: "¿Qué lanzador tiene la mayor cantidad de ponches en la historia de la MLB?",
            options: [
              "Randy Johnson",
              "Nolan Ryan",
              "Roger Clemens",
              "Greg Maddux"
            ],
            correctAnswer: 1,
            explanation: "Nolan Ryan tiene el récord con la asombrosa cantidad de 5,714 ponches en su carrera."
          },
          {
            question: "¿Quién fue el último jugador en batear .400 en una temporada?",
            options: [
              "Ted Williams",
              "Tony Gwynn",
              "George Brett",
              "Rod Carew"
            ],
            correctAnswer: 0,
            explanation: "Ted Williams bateó .406 en 1941, lo que lo convierte en el último jugador en lograr un promedio de bateo de .400 en una sola temporada."
          },
          {
            question: "¿Quién tiene el récord de más Guantes de Oro?",
            options: [
              "Brooks Robinson",
              "Ozzie Smith",
              "Roberto Clemente",
              "Greg Maddux"
            ],
            correctAnswer: 3,
            explanation: "El lanzador Greg Maddux tiene el récord con 18 Guantes de Oro."
          },
          {
            question: "¿Quién es el único jugador en ganar el premio MVP tanto en la Liga Americana como en la Liga Nacional?",
            options: [
                "Frank Robinson",
                "Barry Bonds",
                "Hank Aaron",
                "Alex Rodriguez"
            ],
            correctAnswer: 0,
            explanation: "Frank Robinson ganó el MVP en la Liga Nacional en 1961 (Reds) y en la Liga Americana en 1966 (Orioles)."
          },
          {
            question: "¿Quién tiene el récord de la racha de hits más larga en la historia de la MLB?",
            options: [
              "Joe DiMaggio",
              "Pete Rose",
              "Ty Cobb",
              "Paul Molitor"
            ],
            correctAnswer: 0,
            explanation: "La increíble racha de 56 juegos consecutivos con al menos un hit de Joe DiMaggio en 1941 es la más larga en la historia de la MLB."
          },
          {
            question: "¿Qué lanzador ha ganado más premios Cy Young?",
            options: [
              "Randy Johnson",
              "Greg Maddux",
              "Roger Clemens",
              "Steve Carlton"
            ],
            correctAnswer: 2,
            explanation: "Roger Clemens ha ganado 7 premios Cy Young, la mayor cantidad para cualquier lanzador."
          },
          {
            question: "¿Quién es el único jugador que ha bateado 60 o más jonrones en una sola temporada tres veces?",
            options: [
              "Babe Ruth",
              "Sammy Sosa",
              "Mark McGwire",
              "Barry Bonds"
            ],
            correctAnswer: 1,
            explanation: "Sammy Sosa bateó 60+ jonrones en 1998, 1999 y 2001."
          },
          {
            question: "¿Quién es el único jugador en ganar el título de bateo tanto en la Liga Americana como en la Liga Nacional?",
            options: [
              "DJ LeMahieu",
              "Ty Cobb",
              "Ed Delahanty",
              "Rogers Hornsby"
            ],
            correctAnswer: 2,
            explanation: "Ed Delahanty ganó el título de bateo en la Liga Nacional en 1899 (Phillies) y en la Liga Americana en 1902 (Senators)."
          }
      ]
    },
    ja: {
      "Game Rules & Strategy": [
        {
          question: "野球の目的は何ですか？",
          options: [
            "塁を回り、相手より多くの得点を挙げること。",
            "できるだけ多くの本塁打を打つこと。",
            "アウトにならないようにすること。",
            "打者を超えるようにボールを投げること。"
          ],
          correctAnswer: 0,
          explanation: "主な目的は、塁を回って得点を挙げることです。"
        },
        {
          question: "「犠牲フライ」とは何を意味しますか？",
          options: [
            "打者が二塁に進むヒット。",
            "ランナーが得点するフライボール。",
            "ファウルゾーンに落ちるボール。",
            "ホームでアウトを取る守備のプレー。"
          ],
          correctAnswer: 1,
          explanation: "犠牲フライは、ランナーが得点できる戦略的なプレーです。"
        },
        {
          question: "野球の統計で「ERA」とは何を意味しますか？",
          options: [
            "防御率",
            "エラーレートの平均",
            "追加得点率",
            "効果的な得点率"
          ],
          correctAnswer: 0,
          explanation: "ERAは「防御率」を意味し、投手の有効性を測る指標です。"
        },
        {
            question: "野球の目的は何ですか？",
            options: [
              "塁を回って、相手チームより多く得点すること。",
              "できるだけ多くホームランを打つこと。",
              "タッチアウトされないようにすること。",
              "打者を通過するような投球をすること。"
            ],
            correctAnswer: 0,
            explanation: "野球の主な目的は、塁を回って得点を重ね、相手チームより多く得点することです。"
          },
          {
            question: "「犠牲フライ」とはどういう意味ですか？",
            options: [
              "打者が二塁に進むヒット。",
              "走者が得点できるフライ。",
              "ファウルゾーンに落ちるボール。",
              "ホームプレートでアウトにする守備プレー。"
            ],
            correctAnswer: 1,
            explanation: "犠牲フライとは、打者が自分はアウトになる代わりに、走者の得点を助けるために意図的に打ち上げるフライのことです。"
          },
          {
            question: "野球の統計で「ERA」とは何の略ですか？",
            options: [
              "防御率",
              "エラー率",
              "追加得点率",
              "効果的走行率"
            ],
            correctAnswer: 0,
            explanation: "ERAは「Earned Run Average」の略で、日本語では「防御率」といい、投手の有効性を示す指標です。"
          },
          {
            question: "「ダブルプレー」（または「ゲッツー」）とは何ですか？",
            options: [
              "打者が二塁打を打つこと。",
              "1つのプレーで2人の攻撃側の選手がアウトになること。",
              "1回のヒットで走者が2得点すること。",
              "投手が2球連続でストライクを投げること。"
            ],
            correctAnswer: 1,
            explanation: "ダブルプレー（ゲッツー）とは、1つの連続したプレーによって2人の攻撃側の選手がアウトになる守備プレーのことです。"
          },
          {
            question: "「インフィールドフライ」のルールとは何ですか？",
            options: [
              "フライが外野に上がった時に適用されるルール。",
              "ダブルプレーやトリプルプレーを狙って、守備側がわざと簡単なフライを落とすことを防ぐためのルール。",
              "打者が振り逃げで一塁に進むことができるルール。",
              "内野手がベースからどれくらい離れて守れるかを決めるルール。"
            ],
            correctAnswer: 1,
            explanation: "インフィールドフライとは、走者がいる状態で、守備側がダブルプレーやトリプルプレーを狙って、わざと簡単なフライを落とすことを防ぐためのルールです。"
          },
          {
            question: "打者が「ゴロでアウトになる」とはどういう意味ですか？",
            options: [
              "打者がゴロを打ち、一塁でアウトになること。",
              "打者がフライを打ち、外野手に捕球されること。",
              "打者がデッドボールを受けること。",
              "打者が空振り三振すること。"
            ],
            correctAnswer: 0,
            explanation: "打者がゴロを打ち、打者走者が一塁に到達する前に、野手がボールを一塁に送球してアウトにすることです。"
          },
          {
            question: "野球で「ボーク」が宣告されるのはどのような時ですか？",
            options: [
              "走者が盗塁で早くベースを離れすぎた時。",
              "投手が走者を騙そうとして、投球中に不正な動作をした時。",
              "打者が打席中にバッターボックスから出た時。",
              "野手が走者と接触して、走塁を妨害した時"
            ],
            correctAnswer: 1,
            explanation: "ボークとは、投手が走者を騙そうとして、投球中に不正な動作をした時に宣告されます。ボークが宣告されると、全ての走者は1つずつ進塁します。"
          },
          {
            question: "「フルカウント」とは何ですか？",
            options: [
              "3ボール2ストライクの状態。",
              "塁が全て埋まっている状態（満塁）。",
              "9回で同点のこと。",
              "打者がホームランを打ったこと。"
            ],
            correctAnswer: 0,
            explanation: "フルカウントとは、3ボール2ストライクの状態のことです。次の1球で、四球、三振、またはインプレーになります。"
          },
          {
            question: "「タッチアップ」とは何ですか？",
            options: [
              "打球が捕らえられた後、進塁する前に、手でベースに触れること。",
              "タイムを要求すること。",
              "犠牲フライを打つこと",
              "デッドボールを受けること。"
            ],
            correctAnswer: 0,
            explanation: "タッチアップとは、外野への飛球が捕らえられた後、走者が進塁する前に、いったん元の塁に戻り、その塁に触れてからネクストベースにすすむことです。"
          },
          {
            question: "「フォースアウト」とは何ですか？",
            options: [
              "打者が走者になったために、走者が次の塁に進まなければならない時。",
              "投手がフォアボール（四球）を出すこと。",
              "打者が三振すること。",
              "走者がベースについていない状態で、ボールを持った野手にタッチされてアウトになること。"
            ],
            correctAnswer: 0,
            explanation: "フォースアウトとは、打者が走者になったために、塁上の走者が次の塁に進まなければならず、野手がその塁に送球し、走者が到達するより先にアウトにすることです。フォースプレーとも言います。"
          }
      ],
      "Player Achievements": [
        {
          question: "30-30シーズンを達成した最年少の選手は誰ですか？",
          options: [
            "フリオ・ロドリゲス",
            "アレックス・ロドリゲス",
            "ロナルド・アクーニャJr.",
            "マイク・トラウト"
          ],
          correctAnswer: 3,
          explanation: "マイク・トラウトは2012年、20歳で30-30シーズンを達成しました。"
        },
        {
          question: "盗塁の連続成功記録を持つ選手は誰ですか？",
          options: [
            "リッキー・ヘンダーソン",
            "ビンス・コールマン",
            "ルー・ブロック",
            "ティム・レインズ"
          ],
          correctAnswer: 1,
          explanation: "ビンス・コールマンは1989年から1990年にかけて50回の連続成功を記録しました。"
        },
        {
          question: "MLB史上最多本塁打記録を持つ選手は誰ですか？",
          options: [
            "ベーブ・ルース",
            "ハンク・アーロン",
            "バリー・ボンズ",
            "ウィリー・メイズ"
          ],
          correctAnswer: 2,
          explanation: "バリー・ボンズは762本塁打で記録を持っています。"
        },
        {
            question: "30-30シーズンを達成した最年少選手は誰ですか？",
            options: [
              "フリオ・ロドリゲス",
              "アレックス・ロドリゲス",
              "ロナルド・アクーニャ・ジュニア",
              "マイク・トラウト"
            ],
            correctAnswer: 3,
            explanation: "マイク・トラウトは2012年に20歳で30-30シーズンを達成しました。"
          },
          {
            question: "捕まらずに最も多くの連続盗塁の記録を持っているのは誰ですか？",
            options: [
              "リッキー・ヘンダーソン",
              "ビンス・コールマン",
              "ルー・ブロック",
              "ティム・レインズ"
            ],
            correctAnswer: 1,
            explanation: "ビンス・コールマンは1989年から1990年のシーズンにかけて50回連続盗塁の記録を持っています。"
          },
          {
            question: "MLB史上、最も多くのキャリアホームランの記録を持っているのは誰ですか？",
            options: [
              "ベーブ・ルース",
              "ハンク・アーロン",
              "バリー・ボンズ",
              "ウィリー・メイズ"
            ],
            correctAnswer: 2,
            explanation: "バリー・ボンズは、762本のキャリアホームランの記録を持っています。"
          },
          {
            question: "同じイニングで2本の満塁ホームランを打った唯一の選手は誰ですか？",
            options: [
              "フェルナンド・タティス・シニア",
              "ベーブ・ルース",
              "アレックス・ロドリゲス",
              "ジム・ノーザップ"
            ],
            correctAnswer: 0,
            explanation: "フェルナンド・タティス・シニアは、1999年4月23日にセントルイス・カージナルスでプレーしている間に、この信じられないほどの偉業を達成しました。"
          },
          {
            question: "MLB史上、最も多くのキャリア奪三振を記録している投手は誰ですか？",
            options: [
              "ランディ・ジョンソン",
              "ノーラン・ライアン",
              "ロジャー・クレメンス",
              "グレッグ・マダックス"
            ],
            correctAnswer: 1,
            explanation: "ノーラン・ライアンは、驚異的な5,714のキャリア奪三振の記録を持っています。"
          },
          {
            question: "シーズンで.400を打った最後の選手は誰ですか？",
            options: [
              "テッド・ウィリアムズ",
              "トニー・グウィン",
              "ジョージ・ブレット",
              "ロッド・カルー"
            ],
            correctAnswer: 0,
            explanation: "テッド・ウィリアムズは1941年に.406を打ち、単一シーズンで.400の打率を達成した最後の選手となりました。"
          },
          {
            question: "最も多くのゴールドグラブ賞の記録を持っているのは誰ですか？",
            options: [
              "ブルックス・ロビンソン",
              "オジー・スミス",
              "ロベルト・クレメンテ",
              "グレッグ・マダックス"
            ],
            correctAnswer: 3,
            explanation: "投手のグレッグ・マダックスは、18のゴールドグラブ賞の記録を持っています。"
          },
          {
            question: "アメリカンリーグとナショナルリーグの両方でMVP賞を受賞した唯一の選手は誰ですか？",
            options: [
              "フランク・ロビンソン",
              "バリー・ボンズ",
              "ハンク・アーロン",
              "アレックス・ロドリゲス"
            ],
            correctAnswer: 0,
            explanation: "フランク・ロビンソンは、1961年にナショナルリーグ（レッズ）、1966年にアメリカンリーグ（オリオールズ）でMVPを受賞しました。"
          },
          {
            question: "MLB史上、最も長い連続安打記録を持っているのは誰ですか？",
            options: [
              "ジョー・ディマジオ",
              "ピート・ローズ",
              "タイ・カッブ",
              "ポール・モリター"
            ],
            correctAnswer: 0,
            explanation: "1941年のジョー・ディマジオの驚異的な56試合連続安打記録は、MLB史上最長です。"
          },
          {
            question: "最も多くのサイ・ヤング賞を受賞した投手は誰ですか？",
            options: [
              "ランディ・ジョンソン",
              "グレッグ・マダックス",
              "ロジャー・クレメンス",
              "スティーブ・カールトン"
            ],
            correctAnswer: 2,
            explanation: "ロジャー・クレメンスは、投手の中で最も多い7つのサイ・ヤング賞を受賞しています。"
          },
          {
            question: "1シーズンに3回、60本以上のホームランを打った唯一の選手は誰ですか？",
            options: [
              "ベーブ・ルース",
              "サミー・ソーサ",
              "マーク・マグワイア",
              "バリー・ボンズ"
            ],
            correctAnswer: 1,
            explanation: "サミー・ソーサは、1998年、1999年、2001年に60本以上のホームランを打ちました。"
          },
          {
            question: "アメリカンリーグとナショナルリーグの両方で首位打者を獲得した唯一の選手は誰ですか？",
            options: [
              "DJ・ルメイユ",
              "タイ・カッブ",
              "エド・デラハンティ",
              "ロジャース・ホーンスビー"
            ],
            correctAnswer: 2,
            explanation: "エド・デラハンティは、1899年にナショナルリーグ（フィリーズ）、1902年にアメリカンリーグ（セネタース）で首位打者を獲得しました。"
          }
      ]
    }
  };
  